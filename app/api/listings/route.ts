import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 1000; // Збільшено для карт, щоб отримувати всі listings

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getSortOrder(sortBy: string | null) {
  switch (sortBy) {
    case 'priceAsc':
      return { price: 'asc' as const };
    case 'priceDesc':
      return { price: 'desc' as const };
    case 'oldest':
      return { createdAt: 'asc' as const };
    case 'newest':
    case 'relevance':
    default:
      return { createdAt: 'desc' as const };
  }
}

// Кешування для статичних запитів
export const revalidate = 60; // Revalidate кожні 60 секунд

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageParam = parseNumber(searchParams.get('page'));
  const limitParam = parseNumber(searchParams.get('limit'));
  const page = Math.max(pageParam || 1, 1);
  const pageSize = Math.max(1, Math.min(limitParam || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const categoryParam = searchParams.get('category');
  const roomsParam = searchParams.get('rooms');
  const sortByParam = searchParams.get('sortBy');
  const minPrice = parseNumber(searchParams.get('minPrice'));
  const maxPrice = parseNumber(searchParams.get('maxPrice'));
  const minArea = parseNumber(searchParams.get('minArea'));
  const maxArea = parseNumber(searchParams.get('maxArea'));
  const roomsNumber = parseNumber(roomsParam);
  const orderBy = getSortOrder(sortByParam);

  try {
    const supabase = getSupabaseClient(true);

    // Знаходимо правильну назву таблиці
    const tableNames = ['Listing', 'listings', 'Listings', 'listing'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    if (!actualTableName) {
      console.error('[Listings API] Listing table not found');
      console.error('[Listings API] Tried table names:', tableNames);
      return NextResponse.json(
        {
          success: false,
          error: 'Database table not found',
          listings: [],
          page,
          pageSize,
          total: 0,
          hasMore: false,
        },
        { status: 503 },
      );
    }

    console.log(`[Listings API] Using table: ${actualTableName}`);

    // Будуємо запит з фільтрами - використовуємо тільки потрібні поля для оптимізації
    let query = supabase
      .from(actualTableName)
      .select(
        'id, title, description, type, category, price, currency, address, latitude, longitude, area, rooms, images, amenities, status, ownerId, createdAt, updatedAt, views',
        { count: 'exact' },
      );

    const allowedStatuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
    const allowedTypes = ['RENT', 'SALE'] as const;
    const allowedCategories = ['APARTMENT', 'HOUSE', 'COMMERCIAL'] as const;

    // Фільтр по статусу
    // За замовчуванням показуємо тільки PUBLISHED listings
    // PENDING_REVIEW та ARCHIVED (відхилені) не показуються на загальних сторінках
    if (statusParam === 'all') {
      // no status filter - показуємо всі (тільки для адміна)
    } else if (
      statusParam &&
      allowedStatuses.includes(statusParam as (typeof allowedStatuses)[number])
    ) {
      query = query.eq('status', statusParam);
    } else {
      // За замовчуванням показуємо тільки PUBLISHED
      query = query.eq('status', 'PUBLISHED');
    }

    // Фільтр по типу
    if (typeParam && allowedTypes.includes(typeParam as (typeof allowedTypes)[number])) {
      query = query.eq('type', typeParam);
    }

    // Фільтр по категорії
    if (
      categoryParam &&
      allowedCategories.includes(categoryParam as (typeof allowedCategories)[number])
    ) {
      query = query.eq('category', categoryParam);
    }

    // Фільтр по ціні
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    // Фільтр по площі
    if (minArea !== undefined) {
      query = query.gte('area', minArea);
    }
    if (maxArea !== undefined) {
      query = query.lte('area', maxArea);
    }

    // Фільтр по кількості кімнат
    if (roomsNumber !== undefined) {
      if (roomsNumber >= 4) {
        query = query.gte('rooms', roomsNumber);
      } else {
        query = query.eq('rooms', roomsNumber);
      }
    }

    // Сортування
    if ('price' in orderBy) {
      query = query.order('price', { ascending: orderBy.price === 'asc' });
    } else {
      // Використовуємо camelCase назву поля як в схемі БД
      const ascending = 'createdAt' in orderBy ? orderBy.createdAt === 'asc' : false;
      query = query.order('createdAt', { ascending });
    }

    // Пагінація
    query = query.range(skip, skip + pageSize - 1);

    const { data: listings, error, count } = await query;

    if (error) {
      console.error('Error fetching listings from Supabase:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Table name used:', actualTableName);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch listings from database',
          listings: [],
          page,
          pageSize,
          total: 0,
          hasMore: false,
        },
        { status: 500 },
      );
    }

    const total = count || 0;
    const hasMore = skip + (listings?.length || 0) < total;
    interface ListingRow {
      ownerId?: string | null;
      [key: string]: unknown;
    }
    interface OwnerRow {
      id: string;
      name?: string | null;
      email: string;
      avatar?: string | null;
    }
    const ownerIds = Array.from(
      new Set((listings || []).map((l: ListingRow) => l.ownerId).filter(Boolean) as string[]),
    );
    const ownerMap = new Map<string, OwnerRow>();

    if (ownerIds.length > 0) {
      const userTableNames = ['User', 'user', 'Users', 'users'];
      let actualUserTableName: string | null = null;

      for (const tableName of userTableNames) {
        const result = await supabase.from(tableName).select('id').limit(1);
        if (!result.error) {
          actualUserTableName = tableName;
          break;
        }
      }

      if (actualUserTableName) {
        const { data: owners } = await supabase
          .from(actualUserTableName)
          .select('id, name, email, avatar')
          .in('id', ownerIds);

        if (owners) {
          owners.forEach((owner: OwnerRow) => {
            ownerMap.set(owner.id, owner);
          });
        }
      }
    }

    // Маппінг даних з Supabase до формату, який очікують компоненти
    interface ListingData extends ListingRow {
      id: string;
      title: string;
      description?: string | null;
      type: string;
      category: string;
      price: number;
      currency: string;
      address: string;
      latitude?: number | null;
      longitude?: number | null;
      area?: number | null;
      rooms?: number | null;
      images?: string[] | null;
      amenities?: string[] | null;
      status?: string;
      createdAt?: string;
      updatedAt?: string;
    }
    const mappedListings = (listings || []).map((listing: ListingData) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description || '',
      type: listing.type,
      category: listing.category,
      price: listing.price,
      currency: listing.currency || 'UAH',
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      area: listing.area,
      rooms: listing.rooms,
      images: listing.images || [],
      amenities: listing.amenities || [],
      availableFrom: listing.availableFrom || listing['availableFrom'],
      availableTo: listing.availableTo || listing['availableTo'],
      status: listing.status,
      views: listing.views || 0,
      createdAt: listing.createdAt || listing['createdAt'] || new Date().toISOString(),
      updatedAt: listing.updatedAt || listing['updatedAt'] || new Date().toISOString(),
      owner: listing.ownerId
        ? ownerMap.get(listing.ownerId) || {
            id: listing.ownerId,
            name: null,
            email: null,
            avatar: null,
          }
        : {
            id: '',
            name: null,
            email: null,
            avatar: null,
          },
    }));

    // Завжди повертаємо дані з бази, навіть якщо total = 0
    // Mock дані повертаються тільки якщо є помилка запиту до бази
    return NextResponse.json({
      listings: mappedListings,
      page,
      pageSize,
      total,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching listings from database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch listings';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        listings: [],
        page,
        pageSize,
        total: 0,
        hasMore: false,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(true);

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Знаходимо правильну назву таблиці
    const tableNames = ['Listing', 'listings', 'Listings', 'listing'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    if (!actualTableName) {
      return NextResponse.json({ error: 'Database table not found' }, { status: 503 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      category,
      price,
      currency,
      address,
      latitude,
      longitude,
      area,
      rooms,
      images,
      amenities,
      availableFrom,
      availableTo,
      status,
    } = body;

    const listingData: {
      title: string;
      description: string;
      type: string;
      category: string;
      price: number;
      currency: string;
      address: string;
      status: string;
      ownerId: string;
      latitude?: number;
      longitude?: number;
      area?: number;
      rooms?: number;
      images?: string[];
      amenities?: string[];
      availableFrom?: string;
      availableTo?: string;
    } = {
      title,
      description,
      type,
      category,
      price,
      currency: currency || 'UAH',
      address,
      status: status || 'PENDING_REVIEW', // New listings require admin approval
      ownerId: session.user.id,
    };

    if (latitude !== null && latitude !== undefined) listingData.latitude = latitude;
    if (longitude !== null && longitude !== undefined) listingData.longitude = longitude;
    if (area !== null && area !== undefined) listingData.area = area;
    if (rooms !== null && rooms !== undefined) listingData.rooms = rooms;
    if (images && images.length > 0) listingData.images = images;
    if (amenities && amenities.length > 0) listingData.amenities = amenities;
    if (availableFrom) listingData['availableFrom'] = availableFrom;
    if (availableTo) listingData['availableTo'] = availableTo;

    const { data: listing, error } = await supabase
      .from(actualTableName)
      .insert(listingData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      return NextResponse.json(
        { error: 'Failed to create listing', details: error.message },
        { status: 500 },
      );
    }

    // Отримуємо дані owner
    const userTableNames = ['User', 'user', 'Users', 'users'];
    let actualUserTableName: string | null = null;

    for (const tableName of userTableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualUserTableName = tableName;
        break;
      }
    }

    let owner = null;
    if (actualUserTableName && listing.ownerId) {
      const { data: ownerData } = await supabase
        .from(actualUserTableName)
        .select('id, name, email, avatar')
        .eq('id', listing.ownerId)
        .single();
      owner = ownerData;
    }

    // Маппінг даних
    const mappedListing = {
      ...listing,
      owner: owner || {
        id: listing.ownerId,
        name: null,
        email: null,
        avatar: null,
      },
    };

    return NextResponse.json(mappedListing, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create listing', details: errorMessage },
      { status: 500 },
    );
  }
}

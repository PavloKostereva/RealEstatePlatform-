import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';
import { headers } from 'next/headers';

export async function GET() {
  try {
    // Отримуємо headers
    const headersList = headers();
    const cookieHeader = headersList.get('cookie') || '';

    console.log('Admin stats API - Request info:', {
      hasCookie: !!cookieHeader,
      cookieLength: cookieHeader.length,
    });

    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });

    if (!session) {
      console.log('Admin stats API - No session found');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No session found' },
        { status: 401 },
      );
    }

    if (session.user.role !== 'ADMIN') {
      console.log('Admin stats API - User is not ADMIN:', {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: `User role is ${session.user.role}, expected ADMIN`,
        },
        { status: 401 },
      );
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Prisma Client автоматично керує підключеннями, тому не потрібно явно викликати $connect()

    let totalListings = 0;
    let totalUsers = 0;
    let pendingListings = 0;
    let listingsThisWeek = 0;
    let usersThisWeek = 0;
    let allListings: { createdAt: Date }[] = [];
    let allUsers: { createdAt: Date }[] = [];

    try {
      [
        totalListings,
        totalUsers,
        pendingListings,
        listingsThisWeek,
        usersThisWeek,
        allListings,
        allUsers,
      ] = await Promise.all([
        prisma.listing.count().catch(() => 0),
        prisma.user.count().catch(() => 0),
        prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }).catch(() => 0),
        prisma.listing.count({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        }).catch(() => 0),
        prisma.user.count({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        }).catch(() => 0),
        prisma.listing.findMany({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          select: { createdAt: true },
        }).catch(() => []),
        prisma.user.findMany({
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          select: { createdAt: true },
        }).catch(() => []),
      ]);
    } catch (queryError) {
      console.error('Database query error:', queryError);
      // Повертаємо порожні дані замість помилки
      return NextResponse.json({
        totalListings: 0,
        totalUsers: 0,
        pendingListings: 0,
        listingsThisWeek: 0,
        usersThisWeek: 0,
        listingsByDay: days.map((day) => ({
          date: format(day, 'dd.MM'),
          count: 0,
        })),
        usersByDay: days.map((day) => ({
          date: format(day, 'dd.MM'),
          count: 0,
        })),
        error: 'Database query failed, returning empty data',
      });
    }

    const listingsByDay = days.map((day) => {
      const count = allListings.filter(
        (listing) => format(listing.createdAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'),
      ).length;
      return {
        date: format(day, 'dd.MM'),
        count,
      };
    });

    const usersByDay = days.map((day) => {
      const count = allUsers.filter(
        (user) => format(user.createdAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'),
      ).length;
      return {
        date: format(day, 'dd.MM'),
        count,
      };
    });

    return NextResponse.json({
      totalListings,
      totalUsers,
      pendingListings,
      listingsThisWeek,
      usersThisWeek,
      listingsByDay,
      usersByDay,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

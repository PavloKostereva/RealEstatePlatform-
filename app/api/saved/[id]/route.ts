import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const resolvedParams = params instanceof Promise ? await params : params;
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as any,
    });
    if (!session) {
      return NextResponse.json({ saved: false });
    }

    const saved = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: resolvedParams.id,
        },
      },
    });

    return NextResponse.json({ saved: !!saved });
  } catch (error) {
    console.error('Error checking saved:', error);
    return NextResponse.json({ saved: false });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const resolvedParams = params instanceof Promise ? await params : params;
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as any,
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Перевіряємо, чи вже збережено
    const existing = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: resolvedParams.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const saved = await prisma.savedListing.create({
      data: {
        userId: session.user.id,
        listingId: resolvedParams.id,
      },
    });

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error saving listing:', error);
    // Якщо помилка через дублікат, повертаємо існуючий запис
    if (error.code === 'P2002') {
      const headersList = headers();
      const session = await getServerSession({
        ...authOptions,
        req: { headers: Object.fromEntries(headersList.entries()) } as any,
      });
      if (session) {
        const resolvedParams = params instanceof Promise ? await params : params;
        const existing = await prisma.savedListing.findUnique({
          where: {
            userId_listingId: {
              userId: session.user.id,
              listingId: resolvedParams.id,
            },
          },
        });
        if (existing) {
          return NextResponse.json(existing);
        }
      }
    }
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const resolvedParams = params instanceof Promise ? await params : params;
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as any,
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.savedListing.delete({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: resolvedParams.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error unsaving listing:', error);
    // Якщо запис не знайдено, це не помилка
    if (error.code === 'P2025') {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Failed to unsave listing' }, { status: 500 });
  }
}

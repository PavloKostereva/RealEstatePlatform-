import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  try {
    // Отримуємо headers для правильної роботи getServerSession в App Router
    const headersList = headers();
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          not: 'ADMIN', // Виключаємо адмінів зі списку
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        ownerVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch users', details: errorMessage },
      { status: 500 }
    );
  }
}

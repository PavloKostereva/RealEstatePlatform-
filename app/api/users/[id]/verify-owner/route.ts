import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { ownerVerified: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error verifying owner:', error)
    return NextResponse.json(
      { error: 'Failed to verify owner' },
      { status: 500 }
    )
  }
}







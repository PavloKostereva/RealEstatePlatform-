import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
}

/**
 * Get authenticated user from session
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as UserRole,
    name: session.user.name,
  };
}

/**
 * Require authentication - returns user or throws error response
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

/**
 * Require specific role - returns user or throws error response
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  return requireRole(['ADMIN']);
}

/**
 * Require owner or admin role
 */
export async function requireOwnerOrAdmin(): Promise<AuthenticatedUser> {
  return requireRole(['OWNER', 'ADMIN']);
}

/**
 * Check if user owns resource or is admin
 */
export function canAccessResource(userId: string, resourceOwnerId: string, userRole: UserRole): boolean {
  return userId === resourceOwnerId || userRole === 'ADMIN';
}

/**
 * API route wrapper for authentication
 */
export function withAuth<T>(
  handler: (req: NextRequest, user: AuthenticatedUser, ...args: unknown[]) => Promise<NextResponse<T>>,
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      const user = await requireAuth();
      return handler(req, user, ...args);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}

/**
 * API route wrapper for role-based access
 */
export function withRole<T>(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, user: AuthenticatedUser, ...args: unknown[]) => Promise<NextResponse<T>>,
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    try {
      const user = await requireRole(allowedRoles);
      return handler(req, user, ...args);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  };
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient(true);

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const bio = formData.get('bio') as string;
    const avatarFile = formData.get('avatar') as File | null;

    let avatarUrl = session.user.image || null;

    if (avatarFile && avatarFile.size > 0) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filename = `${session.user.id}-${Date.now()}.${avatarFile.name.split('.').pop()}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    // Створюємо об'єкт для оновлення з базовими полями
    const updateData: {
      name: string | null;
      phone: string | null;
      avatar: string | null;
      location?: string | null;
      bio?: string | null;
    } = {
      name: name || null,
      phone: phone || null,
      avatar: avatarUrl || null,
    };

    if (location !== null && location !== undefined) {
      updateData.location = location || null;
    }
    if (bio !== null && bio !== undefined) {
      updateData.bio = bio || null;
    }

    let updated: { [key: string]: unknown } | null = null;
    let error: { message?: string; code?: string } | null = null;

    const result1 = await supabase
      .from('User')
      .update(updateData)
      .eq('id', session.user.id)
      .select('id, email, name, phone, avatar, role, location, bio')
      .single();

    if (result1.error) {
      if (result1.error.code === '42703' || result1.error.message?.includes('column')) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { location: _, bio: __, ...baseUpdateData } = updateData;

        const result2 = await supabase
          .from('User')
          .update(baseUpdateData)
          .eq('id', session.user.id)
          .select('id, email, name, phone, avatar, role')
          .single();

        if (result2.error) {
          error = result2.error;
        } else {
          updated = result2.data;
        }
      } else {
        error = result1.error;
      }
    } else {
      updated = result1.data;
    }

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update profile', details: error },
        { status: 500 },
      );
    }

    // Повертаємо дані (location та bio будуть null, якщо не існують в базі)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      location: (updated.location as string | null) || null,
      bio: (updated.bio as string | null) || null,
      avatar: updated.avatar,
      role: updated.role,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

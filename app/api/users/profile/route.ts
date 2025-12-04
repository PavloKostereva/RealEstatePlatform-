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

    const supabase = getSupabaseClient();

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
      avatar: string;
      location?: string | null;
      bio?: string | null;
    } = {
      name: name || null,
      phone: phone || null,
      avatar: avatarUrl,
    };

    // Спробуємо оновити з location та bio, якщо вони існують в базі
    // Якщо ні - оновимо тільки базові поля
    let updated: { [key: string]: unknown } | null = null;
    let error: { message?: string } | null = null;

    // Спочатку спробуємо з усіма полями (включаючи location та bio)
    const updateWithOptional = {
      ...updateData,
      ...(location !== null && location !== undefined && { location: location || null }),
      ...(bio !== null && bio !== undefined && { bio: bio || null }),
    };

    const result1 = await supabase
      .from('User')
      .update(updateWithOptional)
      .eq('id', session.user.id)
      .select('id, email, name, phone, avatar, role')
      .single();

    if (result1.error) {
      // Якщо помилка (можливо через неіснуючі колонки location/bio), спробуємо без них
      console.log(
        'First update attempt failed, trying without optional fields:',
        result1.error.message,
      );

      const result2 = await supabase
        .from('User')
        .update(updateData)
        .eq('id', session.user.id)
        .select('id, email, name, phone, avatar, role')
        .single();

      if (result2.error) {
        error = result2.error;
      } else {
        updated = result2.data;
      }
    } else {
      updated = result1.data;
    }

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    // Повертаємо дані (location та bio будуть null, якщо не існують в базі)
    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      location: updated.location || null,
      bio: updated.bio || null,
      avatar: updated.avatar,
      role: updated.role,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

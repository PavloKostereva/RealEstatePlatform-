import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Використовуємо service_role key для обходу RLS при створенні користувача
    const supabase = getSupabaseClient(true);

    const body = await request.json();
    const { email, password, name, phone, role } = body;

    console.log('Signup attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists - спробуємо обидва варіанти назви таблиці
    let existingUser = null;
    let checkError = null;

    // Спробуємо спочатку з великої літери
    const checkResult1 = await supabase.from('User').select('id').eq('email', email).maybeSingle();

    if (checkResult1.error && checkResult1.error.code === '42P01') {
      // Таблиця не існує, спробуємо з малої літери
      console.log('Table "User" not found, trying "user"');
      const checkResult2 = await supabase
        .from('user')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      existingUser = checkResult2.data;
      checkError = checkResult2.error;
    } else {
      existingUser = checkResult1.data;
      checkError = checkResult1.error;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error checking existing user:', checkError);
      throw checkError;
    }

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID for id
    const { randomUUID } = await import('crypto');
    const userId = randomUUID();

    // Визначаємо назву таблиці (спробуємо обидва варіанти)
    let tableName = 'User';
    let user = null;
    let error = null;

    // Спробуємо створити користувача
    const insertData = {
      id: userId,
      email,
      password: hashedPassword,
      name: name || null,
      phone: phone || null,
      role: role || 'USER',
      ownerVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Attempting to insert user into table:', tableName);
    const result1 = await supabase
      .from(tableName)
      .insert(insertData)
      .select('id, email, name, phone, role, createdAt')
      .single();

    if (result1.error && result1.error.code === '42P01') {
      // Таблиця не існує, спробуємо з малої літери
      console.log('Table "User" not found, trying "user"');
      tableName = 'user';
      const result2 = await supabase
        .from(tableName)
        .insert(insertData)
        .select('id, email, name, phone, role, createdAt')
        .single();

      user = result2.data;
      error = result2.error;
    } else {
      user = result1.data;
      error = result1.error;
    }

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

    // Return more detailed error information
    const errorObj = error as { message?: string; code?: string; details?: string; hint?: string };
    const errorMessage = errorObj?.message || 'Unknown error';
    const errorCode = errorObj?.code || 'UNKNOWN';
    const errorDetails = errorObj?.details || errorObj?.hint || null;

    const response: {
      error: string;
      message: string;
      code: string;
      details?: string | null;
      stack?: string;
      fullError?: string;
    } = {
      error: 'Failed to create user',
      message: errorMessage,
      code: errorCode,
    };

    if (process.env.NODE_ENV === 'development') {
      response.details = errorDetails;
      response.stack = error instanceof Error ? error.stack : undefined;
      response.fullError = JSON.stringify(error, Object.getOwnPropertyNames(error));
    }

    return NextResponse.json(response, { status: 500 });
  }
}

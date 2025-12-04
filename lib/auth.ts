import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { getSupabaseClient } from './supabase';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Використовуємо service_role для обходу RLS при авторизації
        const supabase = getSupabaseClient(true);

        // Спробуємо обидва варіанти назви таблиці
        let user = null;
        let error = null;

        // Спробуємо спочатку з великої літери
        const result1 = await supabase
          .from('User')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (result1.error && result1.error.code === '42P01') {
          // Таблиця не існує, спробуємо з малої літери
          const result2 = await supabase
            .from('user')
            .select('*')
            .eq('email', credentials.email)
            .single();

          user = result2.data;
          error = result2.error;
        } else {
          user = result1.data;
          error = result1.error;
        }

        if (error || !user) {
          console.error('Error fetching user during authorization:', error);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.error('Invalid password for user:', credentials.email);
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/how-it-works',
    error: '/how-it-works',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Обробка Google, Discord та LinkedIn авторизації
      if (
        account?.provider === 'google' ||
        account?.provider === 'discord' ||
        account?.provider === 'linkedin'
      ) {
        console.log(`[${account.provider}] Sign in attempt for:`, user.email);
        console.log(`[${account.provider}] User data:`, {
          email: user.email,
          name: user.name,
          image: user.image,
        });

        const supabase = getSupabaseClient(true);

        try {
          // LinkedIn може не надавати email, тому перевіряємо
          if (!user.email && account.provider === 'linkedin') {
            console.error('[LinkedIn] Email not provided by LinkedIn');
            return false;
          }

          // Перевіряємо чи існує користувач
          let existingUser = null;
          let checkError = null;

          const checkResult1 = await supabase
            .from('User')
            .select('*')
            .eq('email', user.email!)
            .maybeSingle();

          if (checkResult1.error && checkResult1.error.code === '42P01') {
            const checkResult2 = await supabase
              .from('user')
              .select('*')
              .eq('email', user.email!)
              .maybeSingle();
            existingUser = checkResult2.data;
            checkError = checkResult2.error;
          } else {
            existingUser = checkResult1.data;
            checkError = checkResult1.error;
          }

          // LinkedIn може не надавати email, тому перевіряємо
          if (!user.email && account.provider === 'linkedin') {
            console.error('LinkedIn did not provide email address');
            return false;
          }

          // Якщо користувач не існує, створюємо нового
          if (!existingUser && user.email) {
            const tableName = checkError?.code === '42P01' ? 'user' : 'User';

            // Генеруємо випадковий пароль (для Google користувачів він не використовується)
            const randomPassword = await bcrypt.hash(Math.random().toString(), 10);

            const { data: newUser, error: createError } = await supabase
              .from(tableName)
              .insert({
                email: user.email,
                name: user.name || null,
                avatar: user.image || null,
                password: randomPassword, // Google users don't need password
                role: 'USER',
              })
              .select('id, email, name, role, avatar')
              .single();

            if (createError) {
              console.error(`Error creating ${account.provider} user:`, createError);
              return false;
            }

            // Оновлюємо user об'єкт з ID з бази даних
            user.id = newUser.id;
            user.role = newUser.role;
          } else if (existingUser) {
            // Оновлюємо інформацію користувача якщо вона змінилась
            const tableName = checkError?.code === '42P01' ? 'user' : 'User';

            const updates: { name?: string; avatar?: string } = {};
            if (user.name && user.name !== existingUser.name) {
              updates.name = user.name;
            }
            if (user.image && user.image !== existingUser.avatar) {
              updates.avatar = user.image;
            }

            if (Object.keys(updates).length > 0) {
              await supabase.from(tableName).update(updates).eq('id', existingUser.id);
            }

            user.id = existingUser.id;
            user.role = existingUser.role;
          }

          return true;
        } catch (error) {
          console.error(`Error in ${account.provider} signIn callback:`, error);
          return false;
        }
      }

      // Для Credentials provider - стандартна логіка
      return true;
    },
    async jwt({ token, user, trigger }) {
      // При першому вході або оновленні сесії
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'USER';
        token.email = user.email;
      }

      // Якщо сесія оновлюється (trigger === 'update'), перевіряємо актуальну роль з бази
      if (trigger === 'update' && token.id) {
        try {
          const supabase = getSupabaseClient(true);
          const tableNames = ['User', 'user', 'Users', 'users'];
          let actualTableName: string | null = null;

          for (const tableName of tableNames) {
            const result = await supabase.from(tableName).select('id').limit(1);
            if (!result.error) {
              actualTableName = tableName;
              break;
            }
          }

          if (actualTableName) {
            const { data: dbUser } = await supabase
              .from(actualTableName)
              .select('role')
              .eq('id', token.id)
              .single();

            if (dbUser?.role) {
              token.role = dbUser.role;
            }
          }
        } catch (error) {
          console.error('Error fetching user role in JWT callback:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

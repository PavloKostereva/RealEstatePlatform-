import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

// Динамічний імпорт для уникнення проблем з webpack
const ProfileContent = dynamic(
  () =>
    import('@/components/profile/ProfileContent').then((mod) => ({ default: mod.ProfileContent })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    ),
  },
);

export default async function ProfilePage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  const locale = params.locale;
  const allowGuestAccess =
    process.env.NEXT_PUBLIC_ALLOW_GUEST_ACCESS === 'true' || process.env.NODE_ENV !== 'production';

  if (!session && !allowGuestAccess) {
    redirect(`/${locale}/how-it-works`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileContent userId={session?.user.id} isGuest={!session} />
    </div>
  );
}

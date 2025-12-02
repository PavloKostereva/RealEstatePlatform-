import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MyListingsPageContent } from '@/components/listings/MyListingsPageContent';

export default async function MyListingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <MyListingsPageContent userId={session?.user?.id} />
      </div>
    </div>
  );
}

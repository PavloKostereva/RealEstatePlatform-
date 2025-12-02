import { redirect } from 'next/navigation';

export default function MapPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}`);
}


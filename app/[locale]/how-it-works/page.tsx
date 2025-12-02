import { HowItWorksContent } from '@/components/how-it-works/HowItWorksContent';

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // Ensure params is resolved
  await (params instanceof Promise ? params : Promise.resolve(params));
  
  return <HowItWorksContent />;
}

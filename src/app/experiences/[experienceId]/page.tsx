import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ experienceId: string }>;
}

export default async function ExperiencePage({ params }: PageProps) {
  const { experienceId } = await params;
  redirect(`/app/${experienceId}`);
} 
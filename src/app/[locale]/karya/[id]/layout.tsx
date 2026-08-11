import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: karya } = await supabase
    .from('karya')
    .select('title, description, image_url')
    .eq('id', id)
    .single();

  if (!karya) {
    return {
      title: 'Karya Tidak Ditemukan - BEM STMIK Tazkia',
    };
  }

  const title = `${karya.title} | Showcase Karya BEM STMIK Tazkia`;
  const description = karya.description || 'Lihat karya inovatif dari mahasiswa BEM STMIK Tazkia.';
  const images = karya.image_url ? [karya.image_url] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default function KaryaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

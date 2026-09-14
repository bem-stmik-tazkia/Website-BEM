import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";

export async function generateMetadata(
  props: { params: Promise<{ locale: string; id: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  
  const { data: berita } = await supabase
    .from('berita')
    .select('title, image_url, content')
    .eq('slug', params.id)
    .single();

  if (!berita) {
    return {
      title: "Berita Tidak Ditemukan | BEM STMIK Tazkia",
    };
  }

  // Menghapus tag HTML dasar untuk description
  const plainText = berita.content.replace(/<[^>]+>/g, '').trim();
  const description = plainText.length > 150 ? plainText.substring(0, 150) + '...' : (plainText || "Baca berita selengkapnya di website BEM STMIK Tazkia.");

  return {
    title: `${berita.title} | BEM STMIK Tazkia`,
    description: description,
    openGraph: {
      title: berita.title,
      description: description,
      url: `https://bem.stmik.tazkia.ac.id/${params.locale}/berita/${params.id}`,
      images: [
        {
          url: berita.image_url,
          width: 1200,
          height: 630,
          alt: berita.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: berita.title,
      description: description,
      images: [berita.image_url],
    },
  };
}

export default function BeritaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

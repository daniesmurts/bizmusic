import { Metadata } from "next";
import { notFound } from "next/navigation";
import { niches } from "@/lib/data/niches";
import NicheSolutionClient from "@/components/NicheSolutionClient";

export async function generateMetadata(props: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const params = await props.params;
  const niche = niches[params.slug];
  
  if (!niche) {
    return {
      title: "Ниша не найдена",
      description: "Запрошенная страница бизнес-ниши не существует."
    };
  }

  return {
    title: niche.seo.title,
    description: niche.seo.description,
    keywords: niche.seo.keywords,
    openGraph: {
      title: niche.seo.title,
      description: niche.seo.description,
      type: "website",
      images: [
        {
          url: niche.heroImage,
          width: 1200,
          height: 630,
          alt: niche.name,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(niches).map((slug) => ({
    slug,
  }));
}

export default async function NichePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const niche = niches[params.slug];

  if (!niche) {
    notFound();
  }

  return <NicheSolutionClient niche={niche} />;
}

import { getArtistBySlugAction } from "@/lib/actions/artists";
import { notFound } from "next/navigation";
import Image from "next/image";
import { 
  Music, 
  Globe, 
  Share2,
  Disc,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { ArtistProfileClient } from "@/components/ArtistProfileClient";

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getArtistBySlugAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const artist = result.data;

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            fill
            className="object-cover brightness-50 scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 py-12 md:py-20">
          <div className="max-w-7xl mx-auto space-y-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/60 hover:text-neon transition-colors font-black uppercase tracking-widest text-[10px]"
            >
              <ArrowLeft className="w-3 h-3" /> Назад
            </Link>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {artist.isFeatured && (
                  <div className="px-3 py-1 rounded-full bg-neon/20 border border-neon/30 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neon">Рекомендуемый артист</span>
                  </div>
                )}
                <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Артист</span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none text-white">
                {artist.name}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 md:px-12 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
            
            {/* Left Column: Music & Bio */}
            <div className="space-y-16">
              <ArtistProfileClient artist={artist} />
              
              {artist.bio && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                    <div className="w-8 h-[2px] bg-neon" />
                    Биография
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-neutral-400 text-lg leading-relaxed whitespace-pre-wrap">
                      {artist.bio}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sidebar / Links */}
            <div className="space-y-12">
              {/* External Links */}
              <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Ссылки и соцсети</h3>
                
                <div className="space-y-4">
                  {artist.externalLinks?.website && (
                    <a 
                      href={artist.externalLinks.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-neon/30 group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-neutral-500 group-hover:text-neon transition-colors" />
                        <span className="text-sm font-bold text-white">Веб-сайт</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-neutral-700 group-hover:text-neon transition-colors" />
                    </a>
                  )}

                  {artist.externalLinks?.spotify && (
                    <a 
                      href={artist.externalLinks.spotify} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#1DB954]/5 border border-[#1DB954]/10 hover:bg-[#1DB954]/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Disc className="w-5 h-5 text-[#1DB954]" />
                        <span className="text-sm font-bold text-white">Spotify</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#1DB954]/60" />
                    </a>
                  )}

                  {artist.externalLinks?.appleMusic && (
                    <a 
                      href={artist.externalLinks.appleMusic} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#FC3C44]/5 border border-[#FC3C44]/10 hover:bg-[#FC3C44]/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-[#FC3C44]" />
                        <span className="text-sm font-bold text-white">Apple Music</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#FC3C44]/60" />
                    </a>
                  )}

                  {artist.externalLinks?.vk && (
                    <a 
                      href={artist.externalLinks.vk} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#0077FF]/5 border border-[#0077FF]/10 hover:bg-[#0077FF]/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-[#0077FF]" />
                        <span className="text-sm font-bold text-white">VK Music</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#0077FF]/60" />
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="p-8 rounded-[2rem] bg-neon/5 border border-neon/10 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60">Каталог</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">{artist.tracks?.length || 0}</span>
                    <span className="text-sm font-bold text-neutral-500 mb-1.5 uppercase tracking-widest">Треков</span>
                  </div>
                </div>
                
                <div className="w-full h-px bg-neon/10" />
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60">Релизы</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white">{artist.albums?.length || 0}</span>
                    <span className="text-sm font-bold text-neutral-500 mb-1.5 uppercase tracking-widest">Альбомов</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

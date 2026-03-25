// Shared types for the admin CMS

export interface AdminTrack {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  duration: number;
  bpm?: number | null;
  genre?: string | null;
  moodTags: string[];
  isExplicit: boolean;
  isFeatured: boolean;
  energyLevel?: number | null;
  artistId?: string | null;
  artistProfile?: AdminArtist | null;
  coverUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  streamUrl?: string;
  _count?: {
    playLogs: number;
  };
}

export interface AdminArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  bio?: string | null;
  isFeatured: boolean;
  externalLinks: {
    spotify?: string;
    vk?: string;
    appleMusic?: string;
    website?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  _count?: {
    tracks: number;
    albums: number;
  };
}

export interface AdminPlaylist {
  id: string;
  name: string;
  businessId?: string | null;
  tracks?: { track: AdminTrack }[];
}

export interface AdminBusiness {
  id: string;
  legalName: string;
  inn: string;
  kpp?: string | null;
  address: string;
  subscriptionStatus: string;
  createdAt: Date;
  user: {
    email: string;
  };
  _count: {
    locations: number;
    playLogs: number;
  };
  licenses: {
    id: string;
    pdfUrl: string;
  }[];
}

export interface AdminPlayLog {
  id: string;
  playedAt: Date;
  trackId: string;
  track: {
    title: string;
    artist: string;
  } | null;
  businessId?: string | null;
  business?: {
    legalName: string;
  } | null;
  locationId?: string | null;
  location?: {
    name: string;
  } | null;
}

export interface AlbumWithTracks {
  id: string;
  title: string;
  artist: string;
  artistId?: string | null;
  artistProfile?: AdminArtist | null;
  coverUrl?: string | null;
  description?: string | null;
  releaseDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  tracks?: AdminTrack[];
}

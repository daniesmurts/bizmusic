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
  energyLevel?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  streamUrl?: string;
  _count?: {
    playLogs: number;
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
  };
  businessId?: string | null;
  business?: {
    legalName: string;
  } | null;
  locationId?: string | null;
  location?: {
    name: string;
  } | null;
}

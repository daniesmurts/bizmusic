export interface TrackDownloadUrlOptions {
  source?: string;
  songOfWeekId?: string | null;
}

export function buildTrackDownloadUrl(trackId: string, options: TrackDownloadUrlOptions = {}): string {
  const params = new URLSearchParams();

  if (options.source) {
    params.set("source", options.source);
  }

  if (options.songOfWeekId) {
    params.set("songOfWeekId", options.songOfWeekId);
  }

  const query = params.toString();
  const encodedTrackId = encodeURIComponent(trackId);

  return query.length > 0
    ? `/api/download/track/${encodedTrackId}?${query}`
    : `/api/download/track/${encodedTrackId}`;
}

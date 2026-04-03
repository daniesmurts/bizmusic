export interface AnnouncementSubmitInput {
  title: string;
  text: string;
  provider: "google" | "sberbank";
  voiceName: string;
  speakingRate: number;
  pitch: number;
  selectedJingleId?: string;
  useSsml: boolean;
  ssmlText?: string;
}

export interface AnnouncementActionPayload {
  title: string;
  text: string;
  provider: "google" | "sberbank";
  voiceName: string;
  speakingRate: number;
  pitch: number;
  jingleId?: string;
  ssmlText?: string;
}

export function buildAnnouncementPayload(input: AnnouncementSubmitInput): AnnouncementActionPayload {
  return {
    title: input.title,
    text: input.text,
    provider: input.provider,
    voiceName: input.voiceName,
    speakingRate: input.speakingRate,
    pitch: input.pitch,
    jingleId: input.selectedJingleId && input.selectedJingleId.length > 0 ? input.selectedJingleId : undefined,
    ssmlText: input.useSsml ? input.ssmlText?.trim() || undefined : undefined,
  };
}

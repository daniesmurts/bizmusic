import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Google Cloud TTS configuration
const projectId = process.env.GOOGLE_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// SaluteSpeech (Sberbank) configuration
const saluteClientId = process.env.SALUTE_SPEECH_CLIENT_ID;
const saluteClientSecret = process.env.SALUTE_SPEECH_CLIENT_SECRET;

let googleClient: TextToSpeechClient | null = null;
let saluteToken: { token: string; expires: number } | null = null;

interface SberRequestOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  responseType?: "json" | "buffer";
}

interface SaluteTokenResponse {
  access_token: string;
  expires_at?: number | string;
}

export function normalizeExpiryMs(expiresAt?: number | string): number {
  if (typeof expiresAt === "number") {
    // Sber responses can contain either unix seconds or milliseconds.
    return expiresAt > 1_000_000_000_000 ? expiresAt : expiresAt * 1000;
  }

  if (typeof expiresAt === "string") {
    const asNumber = Number(expiresAt);
    if (Number.isFinite(asNumber) && asNumber > 0) {
      return asNumber > 1_000_000_000_000 ? asNumber : asNumber * 1000;
    }

    const parsedDate = Date.parse(expiresAt);
    if (Number.isFinite(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }
  }

  return Date.now() + 30 * 60 * 1000;
}

export function buildSaluteSynthesizeUrl(voiceName: string, format: "mp3" = "mp3"): string {
  const endpoint = new URL("https://smartspeech.sber.ru/rest/v1/text:synthesize");
  endpoint.searchParams.set("voice", voiceName);
  endpoint.searchParams.set("format", format);
  return endpoint.toString();
}

/**
 * Helper for SaluteSpeech API requests.
 */
async function sberFetch<T>(url: string, options: SberRequestOptions): Promise<T | Buffer> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.headers,
    body: options.body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sberbank API Error: ${response.status} ${errorBody}`);
  }

  if (options.responseType === "buffer") {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

function getGoogleClient() {
  if (googleClient) return googleClient;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Google Cloud TTS credentials are not fully configured.");
    return null;
  }

  googleClient = new TextToSpeechClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    projectId,
    fallback: true,
    apiEndpoint: process.env.GOOGLE_TTS_PROXY_ENDPOINT || undefined,
  });

  return googleClient;
}

/**
 * Get SaluteSpeech OAuth Token
 */
async function getSaluteToken(): Promise<string | null> {
  if (!saluteClientId || !saluteClientSecret) {
    console.warn("SaluteSpeech credentials are not configured.");
    return null;
  }

  if (saluteToken && saluteToken.expires > Date.now() + 300000) {
    return saluteToken.token;
  }

  try {
    const auth = Buffer.from(`${saluteClientId}:${saluteClientSecret}`).toString("base64");
    const rqId = crypto.randomUUID();

    const data = await sberFetch<SaluteTokenResponse>("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "RqUID": rqId,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "scope=SALUTE_SPEECH_PERS",
    }) as SaluteTokenResponse;

    if (!data.access_token) throw new Error("Failed to get Salute token");

    saluteToken = {
      token: data.access_token,
      expires: normalizeExpiryMs(data.expires_at),
    };

    return data.access_token;
  } catch (error) {
    console.error("SaluteSpeech Auth Error:", error);
    return null;
  }
}

export interface TTSRequest {
  text: string;
  languageCode?: string;
  voiceName: string;
  speakingRate?: number;
  pitch?: number;
  provider?: "google" | "sberbank";
}

/**
 * Generate audio Buffer from text using Google Cloud TTS
 */
async function generateSpeechGoogle(request: TTSRequest): Promise<Buffer> {
  const ttsClient = getGoogleClient();
  if (!ttsClient) throw new Error("Google Cloud TTS is not configured.");

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text: request.text },
    voice: {
      languageCode: request.languageCode || "ru-RU",
      name: request.voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: request.speakingRate || 1.0,
      pitch: request.pitch || 0.0,
    },
  });

  if (!response.audioContent) throw new Error("Failed to generate audio from Google.");
  return Buffer.from(response.audioContent as Uint8Array);
}

/**
 * Generate audio Buffer from text using Sberbank SaluteSpeech
 */
async function generateSpeechSalute(request: TTSRequest): Promise<Buffer> {
  const token = await getSaluteToken();
  if (!token) throw new Error("SaluteSpeech is not configured.");

  const endpoint = buildSaluteSynthesizeUrl(request.voiceName);

  if ((request.speakingRate ?? 1) !== 1 || (request.pitch ?? 0) !== 0) {
    console.warn("Salute text:synthesize does not support speakingRate/pitch in this implementation.");
  }

  return await sberFetch<never>(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: request.text,
    responseType: "buffer",
  }) as Buffer;
}

/**
 * Unified Speech Generation
 */
export async function generateSpeech(request: TTSRequest): Promise<Buffer> {
  const provider = request.provider || "google";

  if (provider === "sberbank") {
    return generateSpeechSalute(request);
  }

  return generateSpeechGoogle(request);
}

/**
 * List available Russian voices (Static list for Sber, API for Google)
 */
export async function listRussianVoices(provider: "google" | "sberbank" = "google") {
  if (provider === "sberbank") {
    return [
      { name: "Nec_24000", languageCodes: ["ru-RU"], ssmlGender: "FEMALE" },
      { name: "Bys_24000", languageCodes: ["ru-RU"], ssmlGender: "MALE" },
      { name: "May_24000", languageCodes: ["ru-RU"], ssmlGender: "FEMALE" },
      { name: "Tur_24000", languageCodes: ["ru-RU"], ssmlGender: "FEMALE" },
      { name: "Ost_24000", languageCodes: ["ru-RU"], ssmlGender: "MALE" },
    ];
  }

  const ttsClient = getGoogleClient();
  if (!ttsClient) return [];

  const [response] = await ttsClient.listVoices({ languageCode: "ru-RU" });
  return response.voices || [];
}

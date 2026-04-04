import crypto from "node:crypto";

export type BrandVoiceModelStatus =
  | "PENDING"
  | "CONSENT_PENDING"
  | "SAMPLES_PENDING"
  | "TRAINING"
  | "READY"
  | "FAILED"
  | "REVOKED";

export interface BrandVoiceCreateModelInput {
  modelId: string;
  businessId: string;
  actorFullName: string;
  sampleUrls: string[];
}

export interface BrandVoiceCreateModelResult {
  providerModelId: string;
  providerJobId?: string;
  estimatedCompletionAt?: Date;
}

export interface BrandVoiceStatusResult {
  status: BrandVoiceModelStatus;
  estimatedCompletionAt?: Date;
  errorMessage?: string;
}

export interface BrandVoiceSynthesizeInput {
  providerModelId: string;
  text: string;
  speakingRate?: number;
  pitch?: number;
}

export interface BrandVoiceProvider {
  createModel(input: BrandVoiceCreateModelInput): Promise<BrandVoiceCreateModelResult>;
  getModelStatus(providerModelId: string): Promise<BrandVoiceStatusResult>;
  synthesize(input: BrandVoiceSynthesizeInput): Promise<Buffer>;
  deleteModel(providerModelId: string): Promise<void>;
}

class MockBrandVoiceProvider implements BrandVoiceProvider {
  async createModel(input: BrandVoiceCreateModelInput): Promise<BrandVoiceCreateModelResult> {
    const now = Date.now();
    return {
      providerModelId: `mock-${input.modelId}`,
      providerJobId: `job-${now}`,
      estimatedCompletionAt: new Date(now + 1000 * 60 * 60 * 24),
    };
  }

  async getModelStatus(): Promise<BrandVoiceStatusResult> {
    return {
      status: "TRAINING",
      estimatedCompletionAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };
  }

  async synthesize(): Promise<Buffer> {
    throw new Error("Brand Voice synthesize is not configured. Set real provider integration first.");
  }

  async deleteModel(): Promise<void> {
    return;
  }
}

type CachedYandexIamToken = {
  token: string;
  expiresAt: number;
};

let cachedYandexIamToken: CachedYandexIamToken | null = null;

type HttpProviderRequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

class HttpBrandVoiceProvider implements BrandVoiceProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly createPath: string;
  private readonly statusPathTemplate: string;
  private readonly synthPath: string;
  private readonly deletePathTemplate: string;
  private readonly authHeader: string;
  private readonly authPrefix: string;

  constructor() {
    this.baseUrl = (process.env.BRAND_VOICE_PROVIDER_BASE_URL || "").trim().replace(/\/$/, "");
    this.apiKey = (process.env.BRAND_VOICE_PROVIDER_API_KEY || "").trim();
    this.createPath = process.env.BRAND_VOICE_PROVIDER_CREATE_PATH || "/v1/brand-voice/models";
    this.statusPathTemplate = process.env.BRAND_VOICE_PROVIDER_STATUS_PATH || "/v1/brand-voice/models/{providerModelId}";
    this.synthPath = process.env.BRAND_VOICE_PROVIDER_SYNTH_PATH || "/v1/brand-voice/synthesize";
    this.deletePathTemplate = process.env.BRAND_VOICE_PROVIDER_DELETE_PATH || "/v1/brand-voice/models/{providerModelId}";
    this.authHeader = process.env.BRAND_VOICE_PROVIDER_AUTH_HEADER || "Authorization";
    this.authPrefix = process.env.BRAND_VOICE_PROVIDER_AUTH_PREFIX || "Bearer";

    if (!this.baseUrl || !this.apiKey) {
      throw new Error("BRAND_VOICE_PROVIDER_BASE_URL and BRAND_VOICE_PROVIDER_API_KEY are required for http mode");
    }
  }

  async createModel(input: BrandVoiceCreateModelInput): Promise<BrandVoiceCreateModelResult> {
    const response = await this.request<{
      providerModelId?: string;
      providerJobId?: string;
      estimatedCompletionAt?: string;
      modelId?: string;
      jobId?: string;
      eta?: string;
    }>(this.createPath, {
      method: "POST",
      body: {
        modelId: input.modelId,
        businessId: input.businessId,
        actorFullName: input.actorFullName,
        sampleUrls: input.sampleUrls,
      },
    });

    const providerModelId = response.providerModelId || response.modelId;
    if (!providerModelId) {
      throw new Error("Provider did not return providerModelId");
    }

    return {
      providerModelId,
      providerJobId: response.providerJobId || response.jobId,
      estimatedCompletionAt: parseDateOrUndefined(response.estimatedCompletionAt || response.eta),
    };
  }

  async getModelStatus(providerModelId: string): Promise<BrandVoiceStatusResult> {
    const path = this.interpolatePath(this.statusPathTemplate, providerModelId);
    const response = await this.request<{
      status?: string;
      estimatedCompletionAt?: string;
      errorMessage?: string;
      eta?: string;
      error?: string;
    }>(path, { method: "GET" });

    const normalized = normalizeProviderStatus(response.status);
    return {
      status: normalized,
      estimatedCompletionAt: parseDateOrUndefined(response.estimatedCompletionAt || response.eta),
      errorMessage: response.errorMessage || response.error,
    };
  }

  async synthesize(input: BrandVoiceSynthesizeInput): Promise<Buffer> {
    const response = await this.request<{
      audioBase64?: string;
      audioUrl?: string;
      providerModelId?: string;
    }>(this.synthPath, {
      method: "POST",
      body: {
        providerModelId: input.providerModelId,
        text: input.text,
        speakingRate: input.speakingRate,
        pitch: input.pitch,
      },
    });

    if (response.audioBase64) {
      return Buffer.from(response.audioBase64, "base64");
    }

    if (response.audioUrl) {
      const fileResponse = await fetch(response.audioUrl, { cache: "no-store" });
      if (!fileResponse.ok) {
        throw new Error(`Failed to load provider audio URL: ${fileResponse.status}`);
      }
      return Buffer.from(await fileResponse.arrayBuffer());
    }

    throw new Error("Provider did not return audioBase64 or audioUrl");
  }

  async deleteModel(providerModelId: string): Promise<void> {
    const path = this.interpolatePath(this.deletePathTemplate, providerModelId);
    await this.request(path, { method: "DELETE" });
  }

  private async request<T = unknown>(path: string, options: HttpProviderRequestOptions = {}): Promise<T> {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path}`).toString();
    const authValue = this.authPrefix ? `${this.authPrefix} ${this.apiKey}` : this.apiKey;

    const response = await fetch(url, {
      method: options.method || "POST",
      headers: {
        "Content-Type": "application/json",
        [this.authHeader]: authValue,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Brand Voice provider HTTP ${response.status}: ${message || "request failed"}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  private interpolatePath(template: string, providerModelId: string): string {
    return template.replace("{providerModelId}", encodeURIComponent(providerModelId));
  }
}

class YandexBrandVoiceLiteProvider implements BrandVoiceProvider {
  async createModel(): Promise<BrandVoiceCreateModelResult> {
    throw new Error(
      "Yandex Brand Voice Lite обучается в консоли Yandex Cloud. Загрузите датасет в SpeechKit, дождитесь статуса Active и привяжите model URI вручную в панели Brand Voice.",
    );
  }

  async getModelStatus(providerModelId: string): Promise<BrandVoiceStatusResult> {
    if (!providerModelId.trim()) {
      return { status: "FAILED", errorMessage: "Пустой model URI" };
    }

    // У Yandex Brand Voice Lite нет удобного публичного статуса обучения через текущий API-поток.
    // После ручной привязки считаем модель готовой к синтезу.
    return { status: "READY" };
  }

  async synthesize(input: BrandVoiceSynthesizeInput): Promise<Buffer> {
    const authHeader = await getYandexAuthorizationHeader();
    const headers: Record<string, string> = {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    const folderId = (process.env.YANDEX_SPEECHKIT_FOLDER_ID || process.env.YC_FOLDER_ID || "").trim();
    const usingApiKey = authHeader.startsWith("Api-Key ");
    if (!usingApiKey && folderId) {
      headers["x-folder-id"] = folderId;
    }

    const response = await fetch("https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis", {
      method: "POST",
      headers,
      body: JSON.stringify({
        text: input.text,
        model: input.providerModelId,
        hints: buildYandexHints(input),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Yandex SpeechKit error ${response.status}: ${message || "request failed"}`);
    }

    const json = await response.json() as {
      result?: {
        audioChunk?: {
          data?: string;
        };
      };
      error?: {
        message?: string;
      };
    };

    const base64 = json.result?.audioChunk?.data;
    if (!base64) {
      throw new Error(json.error?.message || "Yandex SpeechKit did not return audioChunk.data");
    }

    return Buffer.from(base64, "base64");
  }

  async deleteModel(): Promise<void> {
    return;
  }
}

function parseDateOrUndefined(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeProviderStatus(status?: string): BrandVoiceModelStatus {
  const normalized = (status || "").trim().toUpperCase();

  if (
    normalized === "PENDING" ||
    normalized === "CONSENT_PENDING" ||
    normalized === "SAMPLES_PENDING" ||
    normalized === "TRAINING" ||
    normalized === "READY" ||
    normalized === "FAILED" ||
    normalized === "REVOKED"
  ) {
    return normalized;
  }

  if (normalized === "IN_PROGRESS") return "TRAINING";
  if (normalized === "COMPLETED") return "READY";
  if (normalized === "ERROR") return "FAILED";

  return "FAILED";
}

function buildYandexHints(input: BrandVoiceSynthesizeInput): Array<Record<string, number | string>> {
  const hints: Array<Record<string, number | string>> = [];

  if (typeof input.speakingRate === "number" && Number.isFinite(input.speakingRate)) {
    hints.push({ speed: Math.max(0.1, Math.min(3, input.speakingRate)) });
  }

  // Brand Voice Lite docs center on model URI; pitch is not documented consistently for this path.
  // We ignore pitch here intentionally to avoid invalid synthesis payloads.

  return hints;
}

async function getYandexAuthorizationHeader(): Promise<string> {
  const apiKey = (process.env.YANDEX_SPEECHKIT_API_KEY || "").trim();
  if (apiKey) {
    return `Api-Key ${apiKey}`;
  }

  const staticIamToken = (process.env.YANDEX_IAM_TOKEN || "").trim();
  if (staticIamToken) {
    return `Bearer ${staticIamToken}`;
  }

  const now = Date.now();
  if (cachedYandexIamToken && cachedYandexIamToken.expiresAt - now > 60_000) {
    return `Bearer ${cachedYandexIamToken.token}`;
  }

  const serviceAccountKeyRaw = (process.env.YC_SA_KEY || "").trim();
  if (!serviceAccountKeyRaw) {
    throw new Error("Configure YANDEX_SPEECHKIT_API_KEY, YANDEX_IAM_TOKEN, or YC_SA_KEY for Yandex Brand Voice Lite");
  }

  const serviceAccountKey = JSON.parse(serviceAccountKeyRaw) as {
    id: string;
    service_account_id: string;
    private_key: string;
  };

  if (!serviceAccountKey.id || !serviceAccountKey.service_account_id || !serviceAccountKey.private_key) {
    throw new Error("YC_SA_KEY is missing required fields for IAM token generation");
  }

  const jwt = createYandexServiceAccountJwt(serviceAccountKey);
  const tokenResponse = await fetch("https://iam.api.cloud.yandex.net/iam/v1/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    const message = await tokenResponse.text();
    throw new Error(`Failed to get Yandex IAM token: ${tokenResponse.status} ${message}`);
  }

  const tokenJson = await tokenResponse.json() as { iamToken?: string; expiresAt?: string };
  if (!tokenJson.iamToken) {
    throw new Error("Yandex IAM token response did not include iamToken");
  }

  const expiresAtMs = tokenJson.expiresAt ? new Date(tokenJson.expiresAt).getTime() : now + 12 * 60 * 60 * 1000;
  cachedYandexIamToken = {
    token: tokenJson.iamToken,
    expiresAt: expiresAtMs,
  };

  return `Bearer ${tokenJson.iamToken}`;
}

function createYandexServiceAccountJwt(serviceAccountKey: {
  id: string;
  service_account_id: string;
  private_key: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "PS256",
    typ: "JWT",
    kid: serviceAccountKey.id,
  };

  const payload = {
    aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
    iss: serviceAccountKey.service_account_id,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: serviceAccountKey.private_key,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function getBrandVoiceProvider(): BrandVoiceProvider {
  const mode = process.env.BRAND_VOICE_PROVIDER_MODE || "mock";

  if (mode === "mock") {
    return new MockBrandVoiceProvider();
  }

  if (mode === "http") {
    return new HttpBrandVoiceProvider();
  }

  if (mode === "yandex") {
    return new YandexBrandVoiceLiteProvider();
  }

  throw new Error("Unknown BRAND_VOICE_PROVIDER_MODE. Supported: mock, http, yandex");
}

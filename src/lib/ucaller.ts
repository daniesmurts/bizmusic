const UCALLER_BASE_URL = process.env.UCALLER_BASE_URL || "https://api.ucaller.ru";

function getAuthHeader() {
  const key = process.env.UCALLER_API_KEY;
  const serviceId = process.env.UCALLER_SERVICE_ID;

  if (!key || !serviceId) {
    throw new Error("uCaller credentials are not configured");
  }

  return `Bearer ${key}.${serviceId}`;
}

function normalizeUcallerPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  return digits;
}

interface UcallerInitResponse {
  status: boolean;
  ucaller_id?: number;
  phone?: string;
  code?: string;
  error?: string;
  code_error?: number;
}

interface UcallerInfoResponse {
  status: boolean;
  ucaller_id?: number;
  call_status?: number;
  phone?: string;
  code?: string;
  error?: string;
  code_error?: number;
}

async function ucallerPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${UCALLER_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    const maybeError = payload as { error?: string };
    throw new Error(maybeError.error || `uCaller HTTP ${response.status}`);
  }

  return payload;
}

export async function initUcallerAuth(rawPhone: string, client?: string) {
  const phone = normalizeUcallerPhone(rawPhone);
  if (!/^7\d{10}$/.test(phone)) {
    throw new Error("Некорректный номер телефона. Используйте формат +7XXXXXXXXXX");
  }

  const payload = await ucallerPost<UcallerInitResponse>("/v1.0/initCall", {
    phone,
    unique: crypto.randomUUID(),
    client: client?.slice(0, 64),
    voice: true,
  });

  if (!payload.status || !payload.ucaller_id) {
    throw new Error(payload.error || "Не удалось инициализировать звонок uCaller");
  }

  return {
    ucallerId: payload.ucaller_id,
    maskedPhone: payload.phone ?? "",
    normalizedPhone: phone,
  };
}

export async function verifyUcallerCode(ucallerId: number, code: string) {
  const safeCode = code.replace(/\D/g, "").slice(0, 4).padStart(4, "0");
  if (!/^\d{4}$/.test(safeCode)) {
    throw new Error("Введите 4 цифры кода");
  }

  const payload = await ucallerPost<UcallerInfoResponse>("/v1.0/getInfo", {
    uid: ucallerId,
  });

  if (!payload.status) {
    throw new Error(payload.error || "Ошибка проверки статуса uCaller");
  }

  if (payload.call_status === -1) {
    return { verified: false as const, pending: true as const, message: "Звонок еще обрабатывается. Повторите через несколько секунд." };
  }

  if (payload.call_status !== 1) {
    return { verified: false as const, pending: false as const, message: "Не удалось подтвердить звонок. Попробуйте снова." };
  }

  if ((payload.code ?? "") !== safeCode) {
    return { verified: false as const, pending: false as const, message: "Неверный код подтверждения." };
  }

  return {
    verified: true as const,
    pending: false as const,
    normalizedMaskedPhone: payload.phone ?? "",
  };
}

export { normalizeUcallerPhone };
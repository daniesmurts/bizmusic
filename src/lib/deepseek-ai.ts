// DeepSeek API (OpenAI-compatible). Servers are outside the RF: never put
// customer PII (INN, phones, emails, legal names) into prompts.
const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

const SYSTEM_PROMPT = `Ты профессиональный копирайтер для российского бизнеса. Твоя задача — создавать лаконичные, привлекательные и профессиональные анонсы, подходящие для торговых залов, кафе, ресторанов и бутиков.

Требования:
- Отвечай только на русском языке
- Максимум 500 символов (включая пробелы)
- Деловой, но живой тон
- Ориентация на посетителей в торговом зале
- Чёткий призыв к действию
- Избегай избыточной рекламности

Ответ должен содержать ТОЛЬКО текст анонса, без пояснений.`;

async function callDeepSeekApi(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY не задан. Добавьте ключ DeepSeek в переменные окружения сервера.");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.7,
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    let message: string | undefined;
    try {
      message = (JSON.parse(errorText) as ApiErrorResponse).error?.message?.trim();
    } catch {
      // not JSON
    }

    if (response.status === 401) {
      throw new Error("DeepSeek отклонил ключ API (401). Проверьте DEEPSEEK_API_KEY.");
    }
    if (response.status === 402) {
      throw new Error("На балансе DeepSeek закончились средства (402). Пополните баланс аккаунта.");
    }
    if (response.status === 429) {
      throw new Error("Слишком много запросов к DeepSeek (429). Попробуйте через минуту.");
    }
    throw new Error(`DeepSeek API error ${response.status}: ${message || errorText}`);
  }

  const data = (await response.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) {
    throw new Error("DeepSeek вернул пустой ответ.");
  }
  return content;
}

export async function refineAnnouncementText(
  userDraft: string,
  _locale: "ru-RU" = "ru-RU"
): Promise<string> {
  if (!userDraft || userDraft.trim().length === 0) {
    return userDraft;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Улучши этот анонс для бизнес-аудитории:\n\n"${userDraft}"`,
    },
  ];

  let refinedText: string;

  try {
    refinedText = await callDeepSeekApi(messages);
  } catch (firstError) {
    console.error("[DeepSeek] First attempt failed:", firstError);
    try {
      refinedText = await callDeepSeekApi(messages);
    } catch (retryError) {
      console.error("[DeepSeek] Retry failed:", retryError);
      throw retryError;
    }
  }

  if (refinedText.length > 500) {
    refinedText = refinedText.substring(0, 497).trimEnd() + "...";
  }

  return refinedText.trim();
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GroqErrorResponse {
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

async function callGroqApi(messages: GroqChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY не задан. Добавьте ключ Groq в переменные окружения сервера.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: 200,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");

    try {
      const parsed = JSON.parse(errorText) as GroqErrorResponse;
      const message = parsed.error?.message?.trim();
      const code = parsed.error?.code?.trim();

      if (code === "model_decommissioned") {
        throw new Error(
          `Текущая модель Groq больше не поддерживается. Сейчас используется ${GROQ_MODEL}. Укажите актуальную модель в GROQ_MODEL, если нужно переопределить значение.`
        );
      }

      if (message) {
        throw new Error(`Groq API error ${response.status}: ${message}`);
      }
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message !== errorText) {
        throw parseError;
      }
    }

    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as GroqChatResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) {
    throw new Error("Groq вернул пустой ответ.");
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

  const messages: GroqChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Улучши этот анонс для бизнес-аудитории:\n\n"${userDraft}"`,
    },
  ];

  let refinedText: string;

  try {
    refinedText = await callGroqApi(messages);
  } catch (firstError) {
    console.error("[Groq] First attempt failed:", firstError);
    try {
      refinedText = await callGroqApi(messages);
    } catch (retryError) {
      console.error("[Groq] Retry failed:", retryError);
      throw retryError;
    }
  }

  // Enforce 500-character hard limit
  if (refinedText.length > 500) {
    refinedText = refinedText.substring(0, 497).trimEnd() + "...";
  }

  return refinedText.trim();
}

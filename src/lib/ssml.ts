export interface SsmlSnippet {
  id: string;
  label: string;
  snippet: string;
}

export const SSML_SNIPPETS: SsmlSnippet[] = [
  { id: "speak", label: "Базовый каркас", snippet: "<speak>Текст анонса</speak>" },
  { id: "pause-short", label: "Пауза 300ms", snippet: "<break time='300ms'/>" },
  { id: "pause-long", label: "Пауза 700ms", snippet: "<break time='700ms'/>" },
  { id: "emphasis", label: "Акцент", snippet: "<emphasis level='moderate'>важное сообщение</emphasis>" },
  { id: "prosody-slow", label: "Медленнее", snippet: "<prosody rate='90%'>текст медленнее</prosody>" },
  { id: "prosody-fast", label: "Быстрее", snippet: "<prosody rate='110%'>текст быстрее</prosody>" },
  { id: "say-as-time", label: "Чтение времени", snippet: "<say-as interpret-as='time' format='hms24'>18:30</say-as>" },
];

const ALLOWED_TAGS = new Set(["speak", "break", "emphasis", "prosody", "say-as", "sub", "p", "s"]);
const SELF_CLOSING_TAGS = new Set(["break"]);

export interface SsmlValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateSsmlBasic(input: string): SsmlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const source = input.trim();
  if (!source) {
    return { errors, warnings: ["SSML пустой. Вставьте шаблон или добавьте теги вручную."] };
  }

  const tagRegex = /<\/?([a-zA-Z][\w-]*)(\s[^>]*)?\s*\/?>/g;
  const stack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(source)) !== null) {
    const fullTag = match[0];
    const name = match[1].toLowerCase();
    const isClosing = fullTag.startsWith("</");
    const isSelfClosing = fullTag.endsWith("/>") || SELF_CLOSING_TAGS.has(name);

    if (!ALLOWED_TAGS.has(name)) {
      errors.push(`Недопустимый тег: <${name}>`);
      continue;
    }

    if (isClosing) {
      const last = stack.pop();
      if (last !== name) {
        errors.push(`Нарушена вложенность тегов: ожидался </${last || "..."}>, получен </${name}>`);
      }
      continue;
    }

    if (!isSelfClosing) {
      stack.push(name);
    }
  }

  if (stack.length > 0) {
    errors.push(`Не закрыты теги: ${stack.map((tag) => `<${tag}>`).join(", ")}`);
  }

  if (!source.includes("<speak") || !source.includes("</speak>")) {
    warnings.push("Рекомендуется обернуть SSML в корневой тег <speak>...</speak>.");
  }

  return { errors, warnings };
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date according to locale and format string
 * @param date Date to format
 * @param locale Locale code (e.g., 'ru-RU', 'en-US')
 * @param format Format string (e.g., 'yyyy-MM-dd', 'DD.MM.YYYY')
 */
export function formatDate(
  date: Date,
  localeOrFormat: string = "en-US"
): string {
  // If it looks like a format string (contains special chars), use it as format
  if (localeOrFormat.includes("-") && localeOrFormat.length <= 10) {
    // Assume it's a format like 'yyyy-MM-dd'
    if (localeOrFormat === "yyyy-MM-dd") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  // Otherwise treat as locale code
  const locale = localeOrFormat;

  // Russian locale with custom formatting
  if (locale === "ru-RU") {
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year} г.`;
  }

  // Default: use browser locale
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Translates standard Supabase Auth / GoTrue error messages into user-friendly Russian.
 */
export function translateAuthError(message: string): string {
  if (!message) return "Произошла неизвестная ошибка";

  // Password complexity
  if (message.includes("Password should contain at least one character of each")) {
    return "Пароль слишком простой. Используйте сочетание заглавных и строчных букв, цифр и специальных символов.";
  }
  
  const minLengthMatch = message.match(/Password should be at least (\d+) characters/);
  if (minLengthMatch) {
    return `Пароль должен содержать минимум ${minLengthMatch[1]} символов.`;
  }

  // Credentials & Registration
  if (message === "Invalid login credentials") {
    return "Неверный email или пароль";
  }
  if (message === "User already registered") {
    return "Пользователь с таким email уже зарегистрирован";
  }
  if (message === "Email not confirmed") {
    return "Email не подтвержден. Пожалуйста, проверьте вашу почту.";
  }
  if (message === "Signup requires a valid email") {
    return "Введите корректный адрес электронной почты.";
  }
  if (message === "Database error saving new user") {
    return "Не удалось создать аккаунт из-за ошибки базы данных. Попробуйте снова через минуту или обратитесь в поддержку.";
  }

  // Tokens & Links
  if (message.includes("Email link is invalid or has expired")) {
    return "Ссылка подтверждения недействительна или срок её действия истёк.";
  }
  if (message.includes("Token has expired")) {
    return "Код подтверждения истёк. Запросите новый.";
  }

  // Rate limiting
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Слишком много попыток. Пожалуйста, подождите немного и попробуйте снова.";
  }

  // Identity providers
  if (message.includes("provider is not enabled")) {
    return "Данный способ входа временно недоступен.";
  }

  // Fallback: if we translated it before in the component, keep it, 
  // otherwise return the translated message or a generic one if it's too technical
  if (/[a-zA-Z]/.test(message) && message.length > 30) {
    return "Произошла ошибка при аутентификации. Пожалуйста, проверьте введённые данные.";
  }

  return message;
}

export type AnnouncementTemplatePack =
  | "base"
  | "retail"
  | "restaurant"
  | "beauty"
  | "holidays"
  | "summer"
  | "winter";

export interface AnnouncementTemplate {
  id: string;
  pack: AnnouncementTemplatePack;
  packLabel: string;
  name: string;
  title: string;
  text: string;
  provider?: "google" | "sberbank";
}

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  {
    id: "base-welcome-01",
    pack: "base",
    packLabel: "Базовые",
    name: "Приветствие гостей",
    title: "Добро пожаловать",
    text: "Добро пожаловать! Мы рады видеть вас у нас. Если нужна помощь с выбором, обратитесь к сотруднику зала.",
    provider: "sberbank",
  },
  {
    id: "base-closing-01",
    pack: "base",
    packLabel: "Базовые",
    name: "Скорое закрытие",
    title: "Скоро закрытие",
    text: "Уважаемые гости, через 15 минут наше заведение завершает работу. Благодарим за визит и ждем вас снова.",
    provider: "sberbank",
  },
  {
    id: "retail-promo-01",
    pack: "retail",
    packLabel: "Ритейл",
    name: "Акция дня",
    title: "Акция дня",
    text: "Только сегодня действует специальная акция на популярные товары. Уточняйте подробности на кассе. Приятных покупок!",
    provider: "google",
  },
  {
    id: "retail-cross-sell-01",
    pack: "retail",
    packLabel: "Ритейл",
    name: "Дополнительная покупка",
    title: "Рекомендуем к покупке",
    text: "Обратите внимание на товары рядом с кассой. Небольшие приятные покупки сделают ваш день еще лучше.",
    provider: "sberbank",
  },
  {
    id: "restaurant-lunch-01",
    pack: "restaurant",
    packLabel: "Кафе и рестораны",
    name: "Приглашение на бизнес-ланч",
    title: "Бизнес-ланч",
    text: "Напоминаем, что сегодня действует выгодное предложение на бизнес-ланч. Попросите официанта показать меню дня.",
    provider: "sberbank",
  },
  {
    id: "restaurant-dessert-01",
    pack: "restaurant",
    packLabel: "Кафе и рестораны",
    name: "Продвижение десертов",
    title: "Попробуйте десерты",
    text: "Наш шеф подготовил свежие десерты. Отличное завершение обеда или ужина. Приятного аппетита!",
    provider: "google",
  },
  {
    id: "beauty-booking-01",
    pack: "beauty",
    packLabel: "Салоны и услуги",
    name: "Онлайн-запись",
    title: "Удобная онлайн-запись",
    text: "Записаться на следующую процедуру можно сразу у администратора или онлайн в любое удобное время.",
    provider: "sberbank",
  },
  {
    id: "beauty-loyalty-01",
    pack: "beauty",
    packLabel: "Салоны и услуги",
    name: "Программа лояльности",
    title: "Бонусная программа",
    text: "Присоединяйтесь к нашей бонусной программе и получайте персональные предложения и скидки на любимые услуги.",
    provider: "google",
  },
  {
    id: "holiday-new-year-01",
    pack: "holidays",
    packLabel: "Праздничные",
    name: "Новогоднее поздравление",
    title: "С наступающим Новым годом",
    text: "Поздравляем с наступающим Новым годом! Желаем вам тепла, радости и отличного настроения. Спасибо, что вы с нами.",
    provider: "google",
  },
  {
    id: "holiday-february-01",
    pack: "holidays",
    packLabel: "Праздничные",
    name: "Праздничные скидки",
    title: "Праздничная акция",
    text: "В честь праздника для вас действуют специальные предложения. Подробности уточняйте у персонала.",
    provider: "sberbank",
  },
  {
    id: "summer-cold-drinks-01",
    pack: "summer",
    packLabel: "Лето",
    name: "Летние напитки",
    title: "Освежающие напитки",
    text: "Освежитесь в жаркий день нашими летними напитками. Холодные лимонады и фирменные коктейли уже доступны.",
    provider: "google",
  },
  {
    id: "winter-warm-drinks-01",
    pack: "winter",
    packLabel: "Зима",
    name: "Теплые напитки",
    title: "Согревающие напитки",
    text: "Согрейтесь этой зимой с нашими горячими напитками. Попробуйте ароматный чай, какао и фирменные сезонные предложения.",
    provider: "sberbank",
  },
];

export default function CookiesPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block">Техническая информация</span>
        <h2 className="text-6xl font-black mb-2 uppercase tracking-tighter">Использование файлов Cookie</h2>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm italic">Последнее обновление: 20 марта 2026</p>
      </div>

      <p>
        Мы используем файлы cookie для обеспечения корректной работы сервиса, сохранения ваших настроек и анализа того, как вы взаимодействуете с плеером.
      </p>

      <h3>Что такое Cookies?</h3>
      <p>
        Cookie — это небольшие текстовые файлы, которые ваш браузер сохраняет при посещении сайта. Они позволяют сайту «запоминать» ваши действия или предпочтения со временем.
      </p>

      <h3>Типы используемых файлов</h3>
      <ul>
        <li><strong>Обязательные</strong>: Необходимы для аутентификации и работы вашего личного кабинета.</li>
        <li><strong>Функциональные</strong>: Позволяют сохранять настройки громкости, выбранные плейлисты и предпочтения интерфейса.</li>
        <li><strong>Аналитические</strong>: Помогают нам понимать нагрузку на сервис и оптимизировать скорость загрузки аудио.</li>
      </ul>

      <h3>Как управлять Cookies?</h3>
      <p>
        Вы можете заблокировать или удалить файлы cookie через настройки своего браузера. Однако помните, что это может привести к невозможности использования функций аутентификации в сервисе.
      </p>

      <div className="mt-20 border-t border-white/10 pt-10">
        <p className="text-neutral-500 text-xs text-center uppercase tracking-[0.2em] font-black italic shadow-neon shadow-sm">
          Благодарим за использование Бизнес Музыки
        </p>
      </div>
    </>
  );
}

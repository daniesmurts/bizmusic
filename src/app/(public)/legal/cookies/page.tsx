export default function CookiesPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block underline decoration-neon/20 underline-offset-4">ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ</span>
        <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter leading-none">Использование <br /> <span className="text-neon underline decoration-neon/20 underline-offset-8">файлов Cookie</span></h1>
        <div className="flex justify-between items-center text-sm text-neutral-500 mt-12">
          <span>г. Казань, Республика Татарстан, РФ</span>
          <span>Последнее обновление: «25» марта 2026 г.</span>
        </div>
      </div>

      <p className="leading-relaxed text-lg font-medium opacity-90 max-w-4xl">
        Мы используем файлы <strong>cookie</strong> для обеспечения корректной работы сервиса, защиты вашего аккаунта, сохранения ваших персональных настроек и анализа того, как вы взаимодействуете с плеером и библиотекой.
      </p>

      <section className="my-16">
        <div className="p-8 md:p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 blur-[60px] rounded-full group-hover:bg-neon/15 transition-colors" />
          <h2 className="mt-0 text-2xl font-black uppercase tracking-tighter mb-6 relative z-10">Что такое Cookies?</h2>
          <p className="m-0 text-neutral-400 leading-relaxed max-w-3xl relative z-10">
            Cookie — это небольшие текстовые файлы, которые ваш браузер сохраняет на устройстве при посещении сайтов. Они позволяют нам «запоминать» ваши действия (например, авторизацию или уровень громкости) в течение определённого времени, чтобы вам не нужно было вводить их повторно при каждом переключении страниц.
          </p>
        </div>
      </section>

      <section>
        <h2>ТИПЫ ИСПОЛЬЗУЕМЫХ ФАЙЛОВ</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            {
              title: "Обязательные",
              desc: "Необходимы для аутентификации, безопасности и корректной работы личного кабинета.",
              icon: "🔐"
            },
            {
              title: "Функциональные",
              desc: "Позволяют сохранять ваши настройки громкости, эквалайзера и предпочтения интерфейса.",
              icon: "⚙️"
            },
            {
              title: "Аналитические",
              desc: "Помогают нам понимать нагрузку на сервис и оптимизировать скорость загрузки аудио-потоков.",
              icon: "📊"
            }
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-4 p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-neon/20 transition-all duration-500 group">
              <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
              <h3 className="m-0 text-neon text-[10px] font-black uppercase tracking-widest">{item.title}</h3>
              <p className="m-0 text-sm font-medium opacity-60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="my-20">
        <div className="p-10 bg-neon/5 border border-neon/10 rounded-[2.5rem] relative overflow-hidden">
          <h2 className="mt-0 text-2xl font-black uppercase tracking-tighter mb-4">Как управлять Cookies?</h2>
          <p className="m-0 text-white/80 font-medium leading-relaxed max-w-3xl">
            Вы можете заблокировать или удалить файлы cookie через настройки вашего браузера. Однако помните, что это может привести к невозможности использования функций <strong>авторизации</strong> и персонализации в сервисе. Без обязательных cookie работа в личном кабинете будет технически невозможна.
          </p>
        </div>
      </section>

      <div className="mt-32 border-t border-white/10 pt-16 pb-20 text-center">
        <p className="text-neutral-500 text-[10px] uppercase tracking-[0.4em] font-black italic">
          Благодарим <span className="text-neon mx-2">•</span> за доверие <span className="text-neon mx-2">•</span> к Бизнес Музыке
        </p>
        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-4">
          © 2026 IP BUGEMBE DANIEL • ВСЕ ПРАВА ЗАЩИЩЕНЫ
        </p>
      </div>
    </>
  );
}

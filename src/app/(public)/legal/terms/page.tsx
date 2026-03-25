export default function TermsPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block underline decoration-neon/20 underline-offset-4">ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ</span>
        <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter leading-none">Пользовательское <br /> <span className="text-neon underline decoration-neon/20 underline-offset-8">соглашение</span></h1>
        <div className="flex justify-between items-center text-sm text-neutral-500 mt-12">
          <span>г. Казань, Республика Татарстан, РФ</span>
          <span>Редакция от: «25» марта 2026 г.</span>
        </div>
      </div>

      <section>
        <h2>1. ОБЩИЕ ПОЛОЖЕНИЯ</h2>
        <p>1.1. Настоящее Пользовательское соглашение (далее – Соглашение) регулирует отношения между Индивидуальным предпринимателем <strong>Бугембе Даниел</strong> (ИНН 165510859142, ОГРНИП 322169000192683) (далее – Администрация, Лицензиар) и любым лицом, использующим сервис «БизнесМузыка» (далее – Сервис).</p>
        <p>1.2. Использование Сервиса означает полное и безоговорочное принятие условий настоящего Соглашения. Если пользователь не согласен с условиями, он обязан немедленно прекратить использование Сервиса.</p>
        <div className="p-8 bg-neon/5 border border-neon/10 rounded-3xl my-10">
          <p className="m-0 text-white font-bold italic text-lg leading-relaxed">
            1.3. Отношения по предоставлению лицензии на музыку регулируются отдельной <a href="/public-offer" className="text-neon underline underline-offset-4">Публичной офертой</a>. В случае противоречий, Оферта имеет приоритет в части лицензирования.
          </p>
        </div>
        <p>1.4. Администрация вправе изменять условия Соглашения в одностороннем порядке. Изменения вступают в силу с момента публикации новой редакции.</p>
      </section>

      <section>
        <h2>2. СТАТУС ПОЛЬЗОВАТЕЛЯ. РЕГИСТРАЦИЯ</h2>
        <p>2.1. Сервис предназначен для использования юридическими лицами, ИП и физическими лицами, достигшими 18 лет.</p>
        <p>2.2. Для доступа к полному функционалу (стриминг, аналитика, синтез речи, ИИ‑помощь) необходима регистрация в Личном кабинете.</p>
        <p>2.3. Пользователь обязан предоставить достоверные данные и несёт полную ответственность за сохранность своих учётных данных (логин, пароль).</p>
      </section>

      <section>
        <h2>3. ПРАВА И ОБЯЗАННОСТИ ПОЛЬЗОВАТЕЛЯ</h2>
        <div className="grid md:grid-cols-2 gap-8 my-10">
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-colors">
            <h3 className="mt-0 text-neon tracking-widest text-[10px] uppercase font-black mb-4">Пользователь вправе:</h3>
            <ul className="text-sm space-y-2 list-none p-0 opacity-80">
              <li>• Использовать функционал согласно тарифу;</li>
              <li>• Получать техническую поддержку;</li>
              <li>• Управлять данными в Личном кабинете;</li>
              <li>• Пользоваться функциями синтеза речи и ИИ‑помощи.</li>
            </ul>
          </div>
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-colors">
            <h3 className="mt-0 text-neon tracking-widest text-[10px] uppercase font-black mb-4">Пользователь обязан:</h3>
            <ul className="text-sm space-y-2 list-none p-0 opacity-80">
              <li>• Не нарушать законодательство РФ;</li>
              <li>• Не использовать Сервис для нелегального контента;</li>
              <li>• Не передавать доступ третьим лицам;</li>
              <li>• Немедленно сообщать о нарушениях безопасности.</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>4. ПРАВА И ОБЯЗАННОСТИ АДМИНИСТРАЦИИ</h2>
        <p>4.1. Администрация вправе изменять функционал, тарифы и стоимость токенов, а также приостанавливать доступ при нарушении условий.</p>
        <p>4.2. Администрация обязуется обеспечивать работоспособность Сервиса и сохранность персональных данных в соответствии с Политикой конфиденциальности.</p>
      </section>

      <section>
        <h2>5. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ</h2>
        <p>5.1. Все элементы Сервиса (код, дизайн, алгоритмы) являются собственностью Администрации.</p>
        <p>5.2. Пользователь не вправе копировать, модифицировать или декомпилировать ПО Сервиса.</p>
        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] my-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 blur-[50px] rounded-full group-hover:bg-neon/15 transition-colors" />
          <p className="m-0 text-white font-bold italic text-lg leading-relaxed relative z-10">
            5.3. Пользователь сохраняет права на тексты, созданные с помощью ИИ‑помощи, и на сгенерированные аудиофайлы, предоставляя Администрации лицензию на их хранение в рамках Сервиса.
          </p>
        </div>
      </section>

      <section>
        <h2>6. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ</h2>
        <p>6.1. Сервис предоставляется «как есть» (as is). Администрация не гарантирует соответствие ожиданиям при сбоях на стороне внешних провайдеров.</p>
        <p>6.2. Администрация не несёт ответственности за содержание текстов/аудио, созданных пользователем с помощью ИИ, а также за действия третьих лиц при утечке пароля по вине пользователя.</p>
        <p>6.3. Совокупная ответственность ограничена суммой, уплаченной за последние 12 месяцев.</p>
      </section>

      <section>
        <h2>7. СРОК ДЕЙСТВИЯ И ПРЕКРАЩЕНИЕ</h2>
        <p>7.1. Соглашение действует бессрочно.</p>
        <p>7.2. Пользователь может прекратить использование, удалив учётную запись.</p>
        <p>7.3. Администрация вправе заблокировать аккаунт без уведомления при грубых нарушениях.</p>
      </section>

      <div className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] not-prose text-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">8. Заключительные положения</h2>
        <p className="text-neutral-400 text-sm max-w-2xl mx-auto leading-relaxed mb-12">
          Применимое право — законодательство РФ. Споры подлежат рассмотрению в суде г. Казани с соблюдением обязательного досудебного порядка (срок ответа на претензию — 30 дней).
        </p>
        
        <div className="grid md:grid-cols-2 gap-12 text-left">
          <div className="flex flex-col gap-2 p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
             <span className="text-neon text-[10px] font-black uppercase tracking-widest block mb-2">Техническая поддержка</span>
             <p className="text-white font-bold tracking-tight">daniel@boadtech.com</p>
          </div>
          <div className="flex flex-col gap-2 p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-right">
             <span className="text-neon text-[10px] font-black uppercase tracking-widest block mb-2">Актуальная редакция</span>
             <p className="text-white font-bold tracking-tight">bizmuzik.ru/legal/terms</p>
          </div>
        </div>
      </div>
    </>
  );
}

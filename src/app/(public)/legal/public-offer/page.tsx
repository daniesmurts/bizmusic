export default function PublicOfferPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block underline decoration-neon/20 underline-offset-4">ЮРИДИЧЕСКАЯ ДОКУМЕНТАЦИЯ</span>
        <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter leading-none">Публичная <br /> <span className="text-neon underline decoration-neon/20 underline-offset-8">Оферта</span></h1>
        <p className="font-bold opacity-80 mt-8">(Лицензионный договор о предоставлении права использования музыкальных произведений)</p>
        <div className="flex justify-between items-center text-sm text-neutral-500 mt-12">
          <span>г. Казань, Республика Татарстан, РФ</span>
          <span>Редакция от: «25» марта 2026 г.</span>
        </div>
      </div>

      <section>
        <h2>1. ОБЩИЕ ПОЛОЖЕНИЯ</h2>
        <p>1.1. Настоящий документ является публичной офертой (предложением заключить договор) в соответствии со ст. 437 ГК РФ.</p>
        <p>1.2. Оферта адресована юридическим лицам и индивидуальным предпринимателям (далее — Лицензиат), заинтересованным в получении права на публичное исполнение музыкальных произведений.</p>
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl my-10">
          <p className="m-0 text-white font-bold italic text-lg leading-relaxed">
            1.3. Полное и безоговорочное принятие (акцепт) условий осуществляется Лицензиатом путём регистрации, оплаты или начала использования контента. Договор не требует подписания бумажного экземпляра (ст. 434, 438 ГК РФ).
          </p>
        </div>
      </section>

      <section>
        <h2>2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</h2>
        <div className="grid md:grid-cols-2 gap-6 my-10">
          {[
            { t: "Лицензиар", d: "ИП Бугембе Даниел (ИНН 165510859142), владелец Сервиса." },
            { t: "Сервис", d: "Программно-аппаратный комплекс «БизнесМузыка» (веб-плеер, приложение, логирование)." },
            { t: "Произведения", d: "Музыкальные композиции и фонограммы, исключительные права на которые принадлежат Лицензиару." },
            { t: "Точка вещания", d: "Объект (локация), где осуществляется публичное исполнение музыки." },
            { t: "Токен", d: "Условная единица для оплаты синтеза речи и сеансов ИИ-помощи." },
            { t: "Генерация", d: "Создание аудиофайла на основе текста (до 500 символов)." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-2 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-neon/20 transition-colors">
              <span className="text-neon text-[10px] font-black uppercase tracking-widest">{item.t}</span>
              <p className="m-0 text-sm font-medium opacity-70 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>3. ПРЕДМЕТ ДОГОВОРА</h2>
        <p>3.1. Лицензиар предоставляет простую (неисключительную) лицензию на публичное исполнение Произведений из базы Сервиса.</p>
        <p>3.2. Доступ осуществляется исключительно через технические средства Лицензиара.</p>
        <p>3.3. Разрешённый способ использования: фоновое исполнение в коммерческих помещениях на согласованных Территориях.</p>
      </section>

      <section>
        <h2>4. ПРАВА И ОБЯЗАННОСТИ</h2>
        <div className="space-y-8 my-10">
          <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 blur-[60px] rounded-full group-hover:bg-neon/10 transition-colors" />
            <h3 className="mt-0 text-neon tracking-widest text-[10px] uppercase font-black mb-8 underline decoration-neon/20 underline-offset-8">Лицензиат обязан:</h3>
            <ul className="grid md:grid-cols-2 gap-x-12 gap-y-4 list-none p-0 m-0">
              <li className="text-sm font-medium opacity-70 flex items-start gap-3 leading-relaxed">
                <span className="text-neon font-black leading-none mt-1.5">•</span> Не использовать музыку за пределами согласованных Территорий
              </li>
              <li className="text-sm font-medium opacity-70 flex items-start gap-3 leading-relaxed">
                <span className="text-neon font-black leading-none mt-1.5">•</span> Не предоставлять сублицензии и не передавать доступ третьим лицам
              </li>
              <li className="text-sm font-medium opacity-70 flex items-start gap-3 leading-relaxed">
                <span className="text-neon font-black leading-none mt-1.5">•</span> Самостоятельно отслеживать изменения Оферты каждые 7 дней
              </li>
              <li className="text-sm font-medium opacity-70 flex items-start gap-3 leading-relaxed">
                <span className="text-neon font-black leading-none mt-1.5">•</span> Уведомлять Лицензиара о претензиях РАО/ВОИС в течение 3 дней
              </li>
              <li className="text-sm font-medium opacity-70 flex items-start gap-3 leading-relaxed">
                <span className="text-neon font-black leading-none mt-1.5">•</span> Использовать синтез речи и ИИ добросовестно, без нарушений закона
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>5. СИНТЕЗ РЕЧИ И ИИ-ПОМОЩЬ</h2>
        <p>5.1. Доступ к функциям предоставляется при наличии подписки и Токенов. Эти функции не являются лицензией на музыку.</p>
        <div className="grid md:grid-cols-3 gap-6 my-10">
          {[
            { plan: "Бизнес", tts: "30", ai: "5" },
            { plan: "Бизнес+", tts: "100", ai: "10" },
            { plan: "Контент", tts: "10", ai: "2" }
          ].map((p, i) => (
            <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
              <h4 className="mt-0 text-xl font-black uppercase tracking-tighter mb-6">{p.plan}</h4>
              <div className="space-y-2">
                <p className="m-0 text-neon font-black text-2xl tracking-tighter">{p.tts} <span className="text-[10px] uppercase tracking-widest opacity-50">TTS</span></p>
                <p className="m-0 text-white font-black text-2xl tracking-tighter">{p.ai} <span className="text-[10px] uppercase tracking-widest opacity-50">AI</span></p>
              </div>
              <p className="mt-6 mb-0 text-[10px] font-bold uppercase tracking-widest opacity-40">в месяц</p>
            </div>
          ))}
        </div>
        <div className="p-8 bg-neon/5 border border-neon/10 rounded-3xl relative overflow-hidden group mb-10">
           <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 blur-[50px] rounded-full" />
           <p className="m-0 text-white font-bold italic text-sm leading-relaxed relative z-10">
             5.3. Приобретённые Токены <strong>не сгорают</strong> по окончанию месяца и действуют до полного использования. Стоимость: от 150 ₽ за 5 токенов.
           </p>
        </div>
      </section>

      <section>
        <h2>6. ГАРАНТИИ И ОТВЕТСТВЕННОСТЬ</h2>
        <p>6.1. Лицензиар гарантирует обладание правами на все Произведения в объёме, достаточном для исполнения Договора.</p>
        <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] my-10 relative overflow-hidden">
          <p className="m-0 text-white font-bold italic text-lg leading-relaxed relative z-10">
            6.2. В соответствии с п. 2 ст. 1243 ГК РФ, организации по управлению правами (РАО, ВОИС) <strong>не вправе требовать вознаграждения</strong> при наличии прямого договора с Лицензиаром.
          </p>
        </div>
        <p>6.5. Совокупная ответственность ограничена суммой уплаченного вознаграждения за последние 12 месяцев.</p>
        <p>6.7. Лицензиар не несёт ответственности за содержание текстов/аудио, созданных пользователем через ИИ или синтез речи.</p>
      </section>

      <section>
        <h2>7. ПОРЯДОК РАСЧЁТОВ</h2>
        <p>7.1. Вознаграждение определяется Тарифами. Оплата производится в рублях РФ через платёжный агрегатор Т-Банк.</p>
        <p>7.3. Лицензиар применяет УСН. НДС не облагается (п. 2 ст. 346.11 НК РФ).</p>
        <p>7.5. Стороны признают юридическую силу электронных документов (63-ФЗ).</p>
        <p>7.8. Отсутствие возражений в течение 5 рабочих дней признаётся согласием с объёмом и качеством услуг.</p>
      </section>

      <section className="mt-32 pt-16 border-t border-white/10 relative overflow-hidden not-prose">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full" />
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">12. Реквизиты Лицензиара</h2>
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h4 className="text-neon text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-[1px] bg-neon opacity-40" /> Лицензиар
            </h4>
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <p className="text-lg font-black text-white m-0">ИП Бугембе Даниел</p>
              <div className="space-y-2 mt-4 text-sm font-bold opacity-60 leading-relaxed">
                <p className="m-0">ИНН: 165510859142</p>
                <p className="m-0">ОГРНИП: 322169000192683</p>
                <p className="m-0">г. Казань, Республика Татарстан, РФ</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-neon text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-[1px] bg-neon opacity-40" /> Банковские реквизиты
            </h4>
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
              <p className="text-lg font-black text-white m-0 tracking-tight">ПАО "Контур.Банк"</p>
              <div className="space-y-2 mt-4 text-sm font-bold opacity-60 leading-relaxed">
                <p className="m-0">БИК: 046577904</p>
                <p className="m-0">Корр: 30101810500000000904</p>
                <p className="m-0">Р/С: 40802810910010492581</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-20 border-t border-white/10 pt-10 pb-20">
        <p className="text-neutral-500 text-[10px] text-center uppercase tracking-[0.4em] font-black italic shadow-neon shadow-sm">
          Благодарим <span className="text-neon mx-2">•</span> за выбор профессионалов <span className="text-neon mx-2">•</span> Бизнес Музыка
        </p>
        <p className="text-neutral-600 text-[10px] text-center uppercase tracking-widest font-bold mt-4">
          Приложение №1 (Подтверждение) формируется автоматически в Личном кабинете
        </p>
      </div>
    </>
  );
}

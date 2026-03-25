export default function DataProcessingPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block underline decoration-neon/20 underline-offset-4">ФОРМА СОГЛАСИЯ</span>
        <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter leading-none">Согласие <br /> <span className="text-neon underline decoration-neon/20 underline-offset-8 text-3xl md:text-5xl">на обработку данных</span></h1>
        <div className="flex justify-between items-center text-sm text-neutral-500 mt-12">
          <span>г. Казань, Республика Татарстан, РФ</span>
          <span>«25» марта 2026 г.</span>
        </div>
      </div>

      <p className="leading-relaxed text-lg font-medium opacity-90 max-w-4xl">
        Я, нижеподписавшийся(аясь), действуя свободно, своей волей и в своём интересе, на основании ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных», даю своё согласие Индивидуальному предпринимателю <strong>Бугембе Даниелу</strong> (ИНН 165510859142, ОГРНИП 322169000192683), зарегистрированному по адресу: Республика Татарстан, г. Казань (далее — Оператор), на обработку моих персональных данных на следующих условиях:
      </p>

      <section>
        <h2>1. ЦЕЛИ ОБРАБОТКИ</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {[
            "Исполнение лицензионного договора",
            "Регистрация в сервисе «БизнесМузыка»",
            "Техническая поддержка и уведомления",
            "Формирование закрывающих документов",
            "Соблюдение налогового законодательства РФ",
            "Обеспечение безопасности аккаунта"
          ].map((goal, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-colors group">
              <span className="text-neon font-black text-xs opacity-40 group-hover:opacity-100 transition-opacity">0{i+1}</span>
              <p className="m-0 text-sm font-bold uppercase tracking-wider leading-relaxed opacity-80">{goal}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>2. КАТЕГОРИИ ДАННЫХ</h2>
        <p>Обработке подлежат следующие данные:</p>
        <div className="space-y-4 my-8">
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon/5 blur-[40px] rounded-full group-hover:bg-neon/10 transition-colors" />
            <ul className="grid md:grid-cols-2 gap-x-12 gap-y-4 list-none p-0 m-0">
              <li className="text-sm font-medium opacity-70 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-neon" /> ФИО представителя
              </li>
              <li className="text-sm font-medium opacity-70 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-neon" /> Должность и контакты
              </li>
              <li className="text-sm font-medium opacity-70 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-neon" /> Реквизиты организации
              </li>
              <li className="text-sm font-medium opacity-70 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-neon" /> Банковские реквизиты
              </li>
              <li className="text-sm font-medium opacity-70 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-neon" /> Технические логи (IP, действия)
              </li>
              <li className="text-sm font-medium opacity-70 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-neon" /> Данные использования сервиса
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>3. ПРАВОВЫЕ ОСНОВАНИЯ</h2>
        <ul className="space-y-4 list-none p-0">
          <li className="p-6 bg-white/[0.01] border-l-2 border-neon/30 rounded-r-2xl">
            <p className="m-0 text-neutral-400 font-medium italic">Настоящее Согласие;</p>
          </li>
          <li className="p-6 bg-white/[0.01] border-l-2 border-neon/30 rounded-r-2xl">
            <p className="m-0 text-neutral-400 font-medium italic">Заключение и исполнение договора (п. 5 ч. 1 ст. 6 152-ФЗ);</p>
          </li>
          <li className="p-6 bg-white/[0.01] border-l-2 border-neon/30 rounded-r-2xl">
            <p className="m-0 text-neutral-400 font-medium italic">Исполнение требований законодательства РФ (налоговое, бухгалтерское право).</p>
          </li>
        </ul>
      </section>

      <section>
        <h2>4. СПОСОБЫ И УСЛОВИЯ ОБРАБОТКИ</h2>
        <div className="space-y-6">
          <p>4.1. Обработка осуществляется как автоматизированным, так и неавтоматизированным способом.</p>
          <div className="p-8 bg-neon/5 border border-neon/10 rounded-3xl relative overflow-hidden">
            <p className="m-0 text-white font-bold italic text-lg leading-relaxed">
              4.2. Персональные данные хранятся и обрабатываются на серверах в РФ (Яндекс.Облако) в соответствии с ч. 5 ст. 18 152-ФЗ.
            </p>
          </div>
          <p>4.3. Срок обработки: в течение срока действия договора и 5 лет после его прекращения (для целей учёта и защиты прав).</p>
          <p>4.4. Оператор вправе поручить обработку третьим лицам (хостинг, банки, ЭДО) при условии соблюдения 152-ФЗ.</p>
        </div>
      </section>

      <section>
        <h2>5. ПРАВА СУБЪЕКТА ДАННЫХ</h2>
        <p>Я вправе:</p>
        <div className="grid gap-4 mt-6">
          {[
            "Получать информацию об обработке данных",
            "Требовать уточнения, блокирования или уничтожения данных",
            "Отозвать Согласие через daniel@boadtech.com",
            "Обжаловать действия Оператора в Роскомнадзор"
          ].map((right, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-neon flex-shrink-0" />
              <p className="m-0 text-sm font-medium opacity-80">{right}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>6. ОТЗЫВ СОГЛАСИЯ</h2>
        <p>6.1. Отзыв Согласия осуществляется путём направления уведомления на почту Оператора с пометкой «Отзыв согласия».</p>
        <p>6.2. При отзыве Оператор вправе продолжить обработку без согласия при наличии законных оснований (ст. 6 152-ФЗ).</p>
      </section>

      <div className="mt-32 p-12 bg-white/[0.02] border border-white/5 rounded-[3rem] not-prose relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full" />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-12">Подтверждение Согласия</h2>
        
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="text-neon text-[10px] font-black uppercase tracking-widest block mb-4">Подпись субъекта</span>
              <div className="h-px bg-white/20 w-full mb-2" />
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">ФИО / Подпись / М.П.</p>
            </div>
            
            <div className="space-y-2">
              <span className="text-neon text-[10px] font-black uppercase tracking-widest block mb-4">Дата</span>
              <p className="text-xl font-black text-white">«25» марта 2026 г.</p>
            </div>
          </div>
          
          <div className="flex flex-col justify-end p-8 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-xs text-neutral-400 leading-relaxed font-medium m-0">
              * Настоящее согласие формируется автоматически в Личном кабинете Лицензиата при регистрации и акцепте Оферты.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

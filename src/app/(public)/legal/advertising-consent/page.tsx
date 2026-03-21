export default function AdvertisingConsentPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block">Согласие на рассылку</span>
        <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-tighter leading-tight">
          Согласие на получение рекламных <br />и информационных рассылок
        </h2>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm italic">
          г. Казань, Республика Татарстан, Российская Федерация
        </p>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm italic">
          «___» _________ 2026 г.
        </p>
      </div>

      <div className="space-y-8 text-lg">
        <p className="text-neutral-400 leading-relaxed">
          Я, нижеподписавшийся(аясь) (далее — Субъект), действуя свободно, своей волей и в своём интересе, 
          в соответствии со <strong>ст. 18 Федерального закона от 13.03.2006 № 38-ФЗ «О рекламе»</strong> и 
          <strong> ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»</strong>, даю своё согласие 
          Индивидуальному предпринимателю Бугембе Даниелу (далее — Оператор), 
          <strong> ИНН 165510859142, ОГРНИП 322169000192683</strong>, на получение рекламных, информационных и маркетинговых материалов 
          и на обработку моих контактных данных в этих целях.
        </p>

        <section>
          <h3>1. ЦЕЛИ РАССЫЛКИ</h3>
          <ol>
            <li>Информирование о новых функциях сервиса «БизнесМузыка» (bizmuzik.ru).</li>
            <li>Сообщение о специальных предложениях, скидках, акциях и промокодах.</li>
            <li>Новости музыкальной индустрии и рекомендации по использованию сервиса.</li>
            <li>Приглашения на вебинары, мероприятия и опросы для улучшения сервиса.</li>
            <li>Важные уведомления об изменениях в тарифах или условиях Оферты (в части, касающейся маркетинговых коммуникаций).</li>
          </ol>
        </section>

        <section>
          <h3>2. КАНАЛЫ КОММУНИКАЦИИ</h3>
          <ol>
            <li>
              Согласие распространяется на следующие каналы связи:
              <ul>
                <li>Электронная почта (E-mail): ___________________________________</li>
                <li>Мессенджеры (WhatsApp, Telegram, Viber): _______________________</li>
                <li>SMS-сообщения на номер: _______________________________________</li>
                <li>Push-уведомления в веб-приложении и мобильном приложении.</li>
              </ul>
            </li>
            <li>
              Оператор обязуется не передавать контактные данные Субъекта третьим лицам 
              для целей их маркетинга без отдельного согласия Субъекта.
            </li>
          </ol>
        </section>

        <section>
          <h3>3. ОБЪЕМ ПЕРСОНАЛЬНЫХ ДАННЫХ</h3>
          <ol>
            <li>
              Для целей рассылки обрабатываются следующие данные:
              <ul>
                <li>Адрес электронной почты;</li>
                <li>Номер мобильного телефона;</li>
                <li>Имя и фамилия контактного лица;</li>
                <li>Данные о предпочтениях (открытия писем, клики, история покупок).</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h3>4. СРОК ДЕЙСТВИЯ</h3>
          <ol>
            <li>Настоящее Согласие действует с момента принятия до момента его отзыва.</li>
            <li>
              Отзыв Согласия не влияет на исполнение основного лицензионного договора 
              (Оферты) в части оказания услуг по музыкальному вещанию, за исключением 
              невозможности информирования об изменениях, требующих уведомления.
            </li>
          </ol>
        </section>

        <section>
          <h3>5. ПОРЯДОК ОТЗЫВА СОГЛАСИЯ (OPT-OUT)</h3>
          <ol>
            <li>
              Субъект вправе отозвать настоящее Согласие в любой момент следующими способами:
              <ul>
                <li>Нажатием на ссылку «Отписаться» (Unsubscribe) в любом рекламном письме.</li>
                <li>Направлением сообщения «СТОП» на SMS-номер рассылки.</li>
                <li>Направлением письменного уведомления на email: <a href="mailto:daniel@boadtech.com" className="text-neon hover:underline">daniel@boadtech.com</a>.</li>
                <li>Через настройки Личного кабинета на сайте <a href="https://bizmuzik.ru" className="text-neon hover:underline" target="_blank" rel="noopener noreferrer">https://bizmuzik.ru</a>.</li>
              </ul>
            </li>
            <li>
              Оператор обязуется прекратить рассылку в течение 5 (пяти) рабочих дней 
              с момента получения уведомления об отзыве.
            </li>
          </ol>
        </section>

        <section>
          <h3>6. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h3>
          <ol>
            <li>
              Настоящее Согласие является добровольным. Отказ в предоставлении Согласия 
              не ограничивает право Субъекта на заключение лицензионного договора-оферты, 
              за исключением невозможности получения маркетинговой информации.
            </li>
            <li>
              Актуальная версия Согласия размещена по адресу: 
              <br />
              <a href="/legal/advertising-consent" className="text-neon hover:underline">https://bizmuzik.ru/legal/advertising-consent</a>
            </li>
          </ol>
        </section>

        <div className="mt-16 p-10 bg-white/5 border border-white/10 rounded-3xl space-y-8">
          <h4 className="mt-0 text-white text-xl font-black uppercase tracking-tighter">Подпись Субъекта</h4>
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="flex-1 w-full">
              <div className="h-px bg-neutral-600 w-full mb-2"></div>
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">(подпись)</span>
            </div>
            <div className="flex-1 w-full">
              <div className="h-px bg-neutral-600 w-full mb-2"></div>
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">(расшифровка)</span>
            </div>
          </div>
          <div className="pt-4">
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
              Дата: «___» _________ 2026 г.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

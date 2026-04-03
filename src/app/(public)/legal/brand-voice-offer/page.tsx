export default function BrandVoiceOfferPage() {
  return (
    <>
      <div className="mb-12">
        <span className="text-neon text-xs font-black uppercase tracking-[0.3em] mb-4 block underline decoration-neon/20 underline-offset-4">ЮРИДИЧЕСКАЯ ДОКУМЕНТАЦИЯ</span>
        <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter leading-none">Brand Voice <br /> <span className="text-neon underline decoration-neon/20 underline-offset-8">as a Service</span></h1>
        <p className="font-bold opacity-80 mt-8">(Публичная оферта на оказание услуг по созданию и использованию цифровой копии голоса)</p>
        <div className="flex justify-between items-center text-sm text-neutral-500 mt-12">
          <span>г. Казань, Республика Татарстан, РФ</span>
          <span>Редакция от: «03» апреля 2026 г.</span>
        </div>
      </div>

      <section>
        <h2>1. Общие положения</h2>
        <p>1.1. Настоящий документ является официальной публичной офертой <strong>Индивидуального предпринимателя Бугембе Даниела</strong> (ОГРНИП: 322169000192683, ИНН: 165510859142), именуемого в дальнейшем «Исполнитель», в адрес любого юридического лица или индивидуального предпринимателя, которые желают получить услуги по созданию и использованию цифровой копии голоса.</p>
        <p>1.2. Акцептом настоящей оферты (т.е. полным и безоговорочным принятием) признаётся совершение лицом следующих действий:</p>
        <ul className="list-none p-0 space-y-4 my-6">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black">•</span>
            заполнение на сайте Исполнителя формы, содержащей полное наименование, ОГРН, ИНН, юридический адрес Заказчика (если эти данные не были предоставлены ранее при регистрации бизнес-профиля);
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black">•</span>
            проставление отметки в чекбоксе «Я подтверждаю достоверность указанных реквизитов и принимаю условия Договора»;
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black">•</span>
            нажатие кнопки «Активировать Brand Voice и оплатить».
          </li>
        </ul>
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl my-10">
          <p className="m-0 text-white font-bold italic text-lg leading-relaxed">
            1.3. С момента акцепта Договор считается заключённым в письменной форме без подписания бумажного экземпляра. Запись об акцепте (дата, время, IP‑адрес, идентификатор пользователя, переданные реквизиты) хранится в базе данных Исполнителя и имеет полную юридическую силу.
          </p>
        </div>
      </section>

      <section>
        <h2>2. Порядок оказания услуг</h2>
        <h3>2.1. Создание Цифрового голоса включает следующие этапы:</h3>
        <p>2.1.1. Заказчик предоставляет Исполнителю <strong>письменное согласие Актора</strong> на обработку биометрических персональных данных (голоса) и создание AI‑голоса. Форма согласия утверждена Исполнителем и является неотъемлемым приложением к настоящему Договору. <strong>Без такого согласия услуги не оказываются.</strong></p>
        <p>2.1.2. Актор предоставляет Исполнителю <strong>образцы голоса</strong> (аудиозаписи) в формате и объёме, указанном в техническом задании (Приложение №1 к настоящему Договору). Обычно требуется не менее [10–30] минут чистой речи в высоком качестве.</p>
        <p>2.1.3. Исполнитель загружает образцы в технологическую платформу, обучает модель и создаёт Цифровой голос. Срок создания: <strong>до [10] рабочих дней</strong> с момента получения всех необходимых материалов.</p>
        <p>2.1.4. Исполнитель предоставляет Заказчику <strong>тестовые примеры</strong> синтеза для утверждения. Если Заказчик не заявляет возражений в течение [3] рабочих дней, Цифровой голос считается принятым.</p>
        <h3>2.2. Предоставление доступа к использованию Цифрового голоса:</h3>
        <p>2.2.1. После создания модели Исполнитель предоставляет Заказчику <strong>API‑ключи</strong> или <strong>веб‑интерфейс</strong> для генерации аудио.</p>
        <p>2.2.2. Заказчик вправе генерировать аудиофайлы (объявления, промо-ролики и т.п.) только в целях, указанных в <strong>согласии Актора</strong> (п.2.1.1). Любое использование за пределами этих целей является нарушением настоящего Договора.</p>
        <p>2.2.3. Заказчик <strong>не вправе</strong> передавать API‑ключи или саму модель Цифрового голоса третьим лицам, за исключением случаев, прямо предусмотренных Договором или согласием Актора.</p>
      </section>

      <section>
        <h2>3. Права и обязанности Сторон</h2>
        <h3>3.1. Исполнитель обязуется:</h3>
        <p>3.1.1. Создать Цифровой голос с качеством, соответствующим рыночным стандартам (разборчивость, естественность).</p>
        <p>3.1.2. Обеспечить техническую поддержку по вопросам генерации аудио в рабочие часы [10:00–19:00 МСК].</p>
        <p>3.1.3. Хранить исходные аудиозаписи Актора и модель Цифрового голоса с соблюдением требований ФЗ‑152 «О персональных данных» и политики конфиденциальности Исполнителя.</p>
        <p>3.1.4. По требованию Заказчика или Актора уничтожить исходные записи и модель в порядке, предусмотренном п.6 настоящего Договора.</p>
        <h3>3.2. Исполнитель вправе:</h3>
        <p>3.2.1. Приостановить оказание услуг при нарушении Заказчиком сроков оплаты или условий использования Цифрового голоса.</p>
        <p>3.2.2. Вносить изменения в технологическую платформу (например, обновлять версию TTS‑движка) без ухудшения качества.</p>
        <h3>3.3. Заказчик обязуется:</h3>
        <p>3.3.1. Получить от Актора все необходимые согласия и предоставить их Исполнителю до начала оказания услуг.</p>
        <p>3.3.2. Использовать Цифровой голос <strong>строго в соответствии с целями</strong>, указанными в согласии Актора.</p>
        <p>3.3.3. <strong>Маркировать все аудиофайлы</strong>, сгенерированные с помощью Цифрового голоса, как созданные искусственным интеллектом, если это требуется действующим законодательством РФ (в частности, поправками к ФЗ «Об информации»). Способ маркировки: вставка метаданных / водяной знак / голосовое предупреждение.</p>
        <p>3.3.4. Не использовать Цифровой голос для создания:</p>
        <ul className="list-none p-0 space-y-2 mt-4 ml-6">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> ложной информации (фейков);
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> порнографического или экстремистского контента;
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> введения в заблуждение относительно личности Актора (например, не выдавать синтезированную речь за реальное высказывание Актора).
          </li>
        </ul>
        <p className="mt-6">3.3.5. Возместить Исполнителю и Актору все убытки, причинённые нарушением п.3.3.2–3.3.4.</p>
        <p>3.3.6. Уведомить Исполнителя о любом случае неправомерного использования Цифрового голоса третьими лицами, если таковое стало известно Заказчику.</p>
        <h3>3.4. Заказчик вправе:</h3>
        <p>3.4.1. Заказать создание <strong>дополнительных голосов</strong> (других акторов) на условиях отдельного соглашения или дополнительного соглашения к настоящему Договору.</p>
        <p>3.4.2. В любой момент отказаться от использования Цифрового голоса, направив уведомление Исполнителю. Отказ не освобождает от обязанности оплатить уже оказанные услуги.</p>
      </section>

      <section>
        <h2>4. Цена и порядок расчётов</h2>
        <p>4.1. Стоимость услуг по настоящему Договору состоит из:</p>
        <h3>4.1.1. Единовременного платежа за создание Цифрового голоса</h3>
        <p>НДС не облагается. Платёж вносится <strong>предварительно</strong> (100% предоплата) в течение [5] рабочих дней с момента подписания Договора.</p>
        <div className="overflow-x-auto my-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">План</th>
                <th className="text-right py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">Разовый платёж</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Старт</td>
                <td className="py-4 px-6 text-right font-black">14 900 ₽</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Бизнес</td>
                <td className="py-4 px-6 text-right font-black">29 900 ₽</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Корпоративный</td>
                <td className="py-4 px-6 text-right font-black">59 900 ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h3>4.1.2. Ежемесячной абонентской платы</h3>
        <p>За право использования Цифрового голоса и доступ к API / веб-интерфейсу. Размер платы зависит от выбранного тарифа:</p>
        <div className="overflow-x-auto my-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">План</th>
                <th className="text-left py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">Ежемесячная плата</th>
                <th className="text-right py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">Символов в месяц</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Старт</td>
                <td className="py-4 px-6 font-black text-white">4 900 ₽</td>
                <td className="py-4 px-6 text-right font-medium opacity-60">10 000</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Бизнес</td>
                <td className="py-4 px-6 font-black text-white">9 900 ₽</td>
                <td className="py-4 px-6 text-right font-medium opacity-60">50 000</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Корпоративный</td>
                <td className="py-4 px-6 font-black text-white">19 900 ₽</td>
                <td className="py-4 px-6 text-right font-medium opacity-60">200 000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>4.1.3. Плата за сверхлимитное использование</h3>
        <div className="overflow-x-auto my-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">План</th>
                <th className="text-right py-4 px-6 text-neon font-black uppercase tracking-widest text-[10px]">Переплата за 1000 символов</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Старт</td>
                <td className="py-4 px-6 text-right font-black">100 ₽</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Бизнес</td>
                <td className="py-4 px-6 text-right font-black">80 ₽</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-6 font-bold">Корпоративный</td>
                <td className="py-4 px-6 text-right font-black">60 ₽</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>4.2. Абонентская плата вносится <strong>ежемесячно авансом</strong> до [5-го числа] текущего месяца. Первый платёж за неполный месяц рассчитывается пропорционально календарным дням.</p>
        <p>4.3. Исполнитель выставляет Заказчику счёт или акт оказанных услуг (для юридического лица – УПД). Заказчик обязан подписать акт в течение [5] рабочих дней или направить мотивированный отказ. При отсутствии подписанного акта и возражений услуги считаются принятыми.</p>
        <p>4.4. Все платежи осуществляются в российских рублях по реквизитам, указанным в разделе 12 Договора.</p>
      </section>

      <section>
        <h2>5. Ответственность Сторон</h2>
        <p>5.1. За нарушение сроков создания Цифрового голоса (п.2.1.3) Исполнитель уплачивает Заказчику пеню в размере <strong>0,1% от стоимости создания</strong> за каждый день просрочки, но не более 10% от этой суммы.</p>
        <p>5.2. За нарушение сроков оплаты Заказчик уплачивает пеню в размере <strong>0,5% от просроченной суммы</strong> за каждый день просрочки.</p>
        <p>5.3. <strong>За использование Цифрового голоса в целях, не разрешённых согласием Актора</strong>, Заказчик уплачивает Исполнителю штраф в размере <strong>трёхкратной стоимости ежемесячной абонентской платы</strong> и дополнительно возмещает все убытки Актора, включая компенсацию морального вреда.</p>
        <p>5.4. Если Цифровой голос используется для создания <strong>фейковых новостей, политических агитационных материалов или экстремистского контента</strong>, Исполнитель вправе <strong>немедленно заблокировать доступ</strong> без возврата оплаты и передать информацию в правоохранительные органы.</p>
        <p>5.5. Совокупная ответственность Исполнителя по настоящему Договору ограничена суммой, равной <strong>годовой абонентской плате</strong>, уплаченной Заказчиком.</p>
        <p>5.6. Исполнитель не несёт ответственности за:</p>
        <ul className="list-none p-0 space-y-2 mt-4 ml-6">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> качество генерации, если Заказчик использовал некачественные исходные аудиозаписи (шум, искажения);
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> действия технологического провайдера (например, Yandex), если они не связаны с виной Исполнителя;
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> убытки, возникшие из-за неправомерного использования API-ключей третьими лицами по вине Заказчика.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Срок действия, изменение и расторжение</h2>
        <p>6.1. Договор вступает в силу с даты подписания и действует <strong>до полного исполнения Сторонами обязательств</strong> или до расторжения.</p>
        <p>6.2. Срок использования Цифрового голоса (лицензионный срок) соответствует сроку, указанному в <strong>согласии Актора</strong> (обычно [1–3] года). По истечении этого срока Заказчик теряет право генерировать новый аудиоконтент, но вправе продолжать использовать ранее созданные файлы, если иное не предусмотрено согласием.</p>
        <p>6.3. <strong>Расторжение по инициативе Заказчика</strong>:</p>
        <ul className="list-none p-0 mt-4 ml-6">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> Заказчик вправе расторгнуть Договор в одностороннем порядке, предупредив Исполнителя за [30] календарных дней. При этом единовременный платёж не возвращается, абонентская плата возвращается за неиспользованный период.
          </li>
        </ul>
        <p className="mt-6">6.4. <strong>Расторжение по инициативе Исполнителя</strong>:</p>
        <ul className="list-none p-0 mt-4 ml-6">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> Исполнитель вправе расторгнуть Договор досрочно при нарушении Заказчиком условий п.3.3.2–3.3.4 (нецелевое использование) или неоплате более [60] дней. В этом случае доступ блокируется, оплата не возвращается.
          </li>
        </ul>
        <p className="mt-6">6.5. <strong>Обязательное удаление данных</strong>:</p>
        <ul className="list-none p-0 mt-4 ml-6">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black leading-none mt-1.5">•</span> При расторжении Договора (по любой причине) Исполнитель <strong>уничтожает исходные аудиозаписи Актора и модель Цифрового голоса</strong> в течение [30] дней, если иное не требуется для исполнения требований законодательства (например, для расследования нарушений). Акт уничтожения направляется Заказчику по запросу.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Конфиденциальность и персональные данные</h2>
        <p>7.1. Стороны обязуются сохранять конфиденциальность любой информации, полученной от другой Стороны и явно помеченной как «конфиденциальная» или являющейся таковой по своему характеру (включая исходные голосовые записи, API-ключи, коммерческие условия).</p>
        <p>7.2. Вопросы обработки персональных данных Актора регулируются <strong>отдельным согласием</strong> (Приложение №2) и Политикой конфиденциальности Исполнителя. Заказчик подтверждает, что получил такое согласие в письменной форме (электронной или бумажной) и вправе передать данные Исполнителю.</p>
        <p>7.3. При передаче Цифрового голоса Заказчику (через API) Заказчик становится <strong>оператором</strong> биометрических данных в той части, в какой он самостоятельно генерирует аудио. Заказчик обязуется соблюдать требования ФЗ-152 при хранении и использовании сгенерированных аудиофайлов.</p>
      </section>

      <section>
        <h2>8. Форс-мажор</h2>
        <p>8.1. Стороны освобождаются от ответственности за неисполнение обязательств, если оно вызвано обстоятельствами непреодолимой силы (пожар, наводнение, военные действия, блокировка технологических сервисов государственными органами и т.п.), при условии, что Сторона уведомила другую Сторону в течение 5 рабочих дней.</p>
      </section>

      <section>
        <h2>9. Разрешение споров</h2>
        <p>9.1. Претензионный порядок обязателен. Срок ответа на претензию – 10 рабочих дней.</p>
        <p>9.2. При недостижении согласия спор передаётся на рассмотрение в <strong>арбитражный суд по месту нахождения Исполнителя</strong> (для юрлиц) или в <strong>суд общей юрисдикции</strong> (для ИП/физлиц).</p>
      </section>

      <section>
        <h2>10. Заключительные положения</h2>
        <p>10.1. Договор составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой Стороны.</p>
        <p>10.2. Все изменения оформляются дополнительными соглашениями в письменной форме.</p>
        <p>10.3. Исполнитель вправе в одностороннем порядке изменять условия Договора, уведомив Заказчика за 15 дней через публикацию на сайте или по электронной почте. Если Заказчик не согласен, он может расторгнуть Договор без штрафа.</p>
        <p>10.4. <strong>Неотъемлемыми приложениями к Договору являются:</strong></p>
        <ul className="list-none p-0 mt-4 ml-6 space-y-2">
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black">•</span> Приложение №1 – Техническое задание (требования к образцам голоса, формат файлов, длительность).
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black">•</span> Приложение №2 – Согласие Актора на обработку биометрических данных (отдельный документ, подписанный Актором).
          </li>
          <li className="flex items-start gap-3 text-sm font-medium opacity-70">
            <span className="text-neon font-black">•</span> Приложение №3 – Прейскурант (цены на сверхлимиты, дополнительные услуги).
          </li>
        </ul>
      </section>

      <section>
        <h2>11. Порядок акцепта (принятия) Договора</h2>
        <p>11.1. Настоящий Договор является <strong>публичной офертой</strong> Исполнителя в соответствии со ст. 437 ГК РФ.</p>
        <p>11.2. Акцептом (полным и безоговорочным принятием) считается совершение Заказчиком следующего действия: нажатие кнопки «Оплатить и активировать Brand Voice» или «Принять условия» на сайте Исполнителя после заполнения формы заказа.</p>
        <p>11.3. С момента акцепта Договор считается заключённым в письменной форме без подписания бумажного экземпляра. Запись об акцепте (дата, время, IP‑адрес, идентификатор пользователя) хранится в базе данных Исполнителя и имеет юридическую силу.</p>
      </section>

      <section className="mt-32 pt-16 border-t border-white/10 relative overflow-hidden not-prose">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 blur-[100px] rounded-full" />
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-12">12. Реквизиты Исполнителя</h2>
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h4 className="text-neon text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-[1px] bg-neon opacity-40" /> Исполнитель
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
      </div>
    </>
  );
}

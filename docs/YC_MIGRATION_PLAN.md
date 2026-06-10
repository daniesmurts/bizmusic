# План миграции на Yandex Cloud (Storage + PostgreSQL)

> Цель: убрать зависимость от Supabase (AWS Frankfurt) и перенести хранилище и
> базу данных в РФ. Это устраняет сразу: блокировки операторов на `supabase.co`,
> таймауты БД без VPN, лимит 3.5 MiB ответа serverless-контейнера, и закрывает
> требование 152-ФЗ о локализации ПДн.

## 0. Что переносим, а что нет

| Компонент | Сейчас | Цель | Действие |
|---|---|---|---|
| База данных | Supabase Postgres (AWS Frankfurt), pgBouncer | **YC Managed PostgreSQL** | Перенос |
| Файлы (аудио, обложки, PDF) | Supabase Storage, бакет `bizmusic-assets` | **YC Object Storage** (S3-совместимый) | Перенос |
| Аутентификация | **Clerk** | Clerk (без изменений) | — |
| Хостинг | YC Serverless Containers | без изменений | — |
| Платежи / Email / Мониторинг | YooKassa·TBank / Resend / Sentry | без изменений | — |
| `storage-proxy` + `rewriteStorageUrl` | обход блокировок + чанкинг | **удалить** (Object Storage доступен напрямую) | Декоммишн |
| `src/utils/supabase/*` | рудимент (Supabase Auth не используется) | удалить | Декоммишн |

**Ключевой выигрыш:** YC Object Storage отдаётся напрямую браузеру, не через
контейнер. Поддерживает Range-запросы нативно, не имеет лимита 3.5 MiB, не
блокируется операторами. Прокси и переписывание URL становятся не нужны.

---

## Фаза 1 — Object Storage (хранилище файлов)

### 1.1 Инфраструктура (YC Console / CLI)
- [x] Создан бакет `bizmuzik` в YC Object Storage.
- [x] Создан сервисный аккаунт со **статическим ключом доступа** и ролью
      `storage.editor` на бакет. Проверено сквозным тестом
      (`node scripts/verify-s3.mjs`): upload → list → presign GET → delete ✅.
- [x] Эндпоинт: `https://storage.yandexcloud.net`, region `ru-central1`.

**Модель доступа (РЕШЕНО):**
- **Приватные** (через presigned GET): `tracks/`, `announcements/` — это
  лицензируемое аудио, не должно качаться анонимно.
- **Публичное чтение** (unsigned URL): `blog/`, `covers/` (обложки) и
  `licenses/` (PDF — открываются на публичной странице проверки `/verify/[id]`
  по неугадываемому UUID, по дизайну инспекторской проверки).
- Применяется bucket policy ниже. **Изменений в коде не требуется.**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadImagesAndLicenses",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::bizmuzik/blog/*",
        "arn:aws:s3:::bizmuzik/covers/*",
        "arn:aws:s3:::bizmuzik/licenses/*"
      ]
    }
  ]
}
```

### 1.2 Перенос данных
- [ ] Установить `s3cmd` или `rclone`, настроить два remote: Supabase S3 и YC S3.
- [ ] `rclone sync supabase:bizmusic-assets yc:bizmuzik` (сохранить структуру
      папок: `tracks/`, `blog/`, `covers/`, `announcements/`, `licenses/` и т.д.).
- [ ] Проверить количество и размер объектов на обеих сторонах.

### 1.3 Изменения в коде — ✅ СКАФФОЛД ГОТОВ
Реализован **переключатель бэкенда хранилища** (не переписывание «на месте»):

- ✅ `src/lib/s3-storage.ts` — новый низкоуровневый модуль на AWS SDK v3
  (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), эндпоинт YC,
  path-style. Экспортирует `S3_ENABLED` и примитивы (presignGet/Put, put, list, delete).
- ✅ `src/lib/supabase-storage.ts` — каждая публичная функция теперь ветвится:
  `if (S3_ENABLED) → S3, else → Supabase`. **Сигнатуры не изменились**, поэтому
  ни один вызов в приложении не правился. `S3_ENABLED = true`, когда заданы
  `S3_BUCKET` + ключи — иначе прод продолжает работать на Supabase.
- ✅ `src/lib/actions/licenses.ts` — 3 прямых `supabaseAdmin...upload` заменены
  на `uploadFileBuffer(...)` (теперь идут через переключатель).
- ✅ Клиентские загрузки (`xhr.open("PUT", uploadUrl)` / `fetch PUT`) совместимы
  с presigned PUT S3 без изменений — подпись не привязана к Content-Type.

**Активация:** задать `S3_*` секреты в GitHub Actions (уже проброшены в
`deploy.yml`) и в `.env.local`. Код уже в проде в «спящем» режиме.

Остаётся доделать при активации:
- [ ] После переноса файлов выставить `S3_*` секреты и проверить чек-лист.
- [ ] `rewriteStorageUrl` — на S3 уже не вызывается (presigned URL отдаётся
      напрямую); полностью удалить прокси в Фазе 3.

Маппинг операций Supabase → S3 (реализован):

| Supabase Storage | S3 (AWS SDK v3) |
|---|---|
| `createSignedUrl(path, exp)` | `getSignedUrl(s3, new GetObjectCommand(...), { expiresIn })` |
| `createSignedUploadUrl(path)` | `getSignedUrl(s3, new PutObjectCommand(...), { expiresIn })` |
| `upload(path, buf, {contentType})` | `PutObjectCommand` |
| `getPublicUrl(path)` | `https://storage.yandexcloud.net/<bucket>/<path>` |
| `list(prefix)` | `ListObjectsV2Command({ Prefix })` |
| `remove([path])` | `DeleteObjectCommand` / `DeleteObjectsCommand` |

- [ ] Переписать `src/lib/supabase-storage.ts` (сохранить сигнатуры
      `getDownloadSignedUrl`, `getUploadSignedUrl`, `uploadFileBuffer`,
      `getFilePublicUrl`, `listTrackFiles`, `deleteFile`, кэш signed URL).
- [ ] `src/lib/actions/licenses.ts` — заменить прямой `supabaseAdmin.storage...upload`
      на `uploadFileBuffer(...)` из хелпера (убрать прямую зависимость).
- [ ] `src/utils/supabase/admin.ts` — удалить (или оставить пустым) после переноса.
- [ ] **Прокси больше не нужен** для обхода блокировок: в `rewriteStorageUrl`
      временно вернуть URL как есть (`return url`), чтобы клиент шёл прямо в YC.
      Позже удалить `storage-proxy` целиком (см. Фаза 3).

### 1.4 Переменные окружения (deploy.yml + .env)
Добавить:
```
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET=bizmuzik-assets
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```
Удалить (после полного переноса): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_UPSTREAM`.

### 1.5 CSP
- [ ] В `next.config.ts` обновить `connect-src` / `media-src`: добавить
      `https://storage.yandexcloud.net`, убрать `*.supabase.co` (после переноса).

---

## Фаза 2 — Managed PostgreSQL (база данных)

### 2.1 Инфраструктура
- [ ] Создать кластер YC Managed PostgreSQL (PostgreSQL 16), 1 хост для старта
      (можно 2 для HA позже). Конфиг из прежней оценки ресурсов.
- [ ] Создать БД `bizmusic` и пользователя приложения.
- [ ] Включить «Доступ из интернета» (public IP) ИЛИ держать контейнер и кластер
      в одной сети (предпочтительно — приватно, контейнер уже в YC).
- [ ] Скачать корневой сертификат YC (`CA.pem`) для TLS-подключения.

### 2.2 Перенос схемы и данных
- [ ] Применить миграции Drizzle к новой БД: `drizzle/0000…0008*.sql`
      (через `drizzle-kit migrate` с новым `DATABASE_URL`).
- [ ] Дамп данных из Supabase: `pg_dump --no-owner --no-acl --data-only` (или
      полный дамп со схемой, если проще), порт 5432 (session pooler / direct).
- [ ] Восстановить в YC: `pg_restore` / `psql`.
- [ ] Сверить количество строк по ключевым таблицам (`users`, `tracks`,
      `play_logs`, `licenses`, `businesses`, реферальные таблицы).

### 2.3 Изменения в коде
- [ ] `src/db/index.ts` — пул заточен под pgBouncer (transaction mode, `keepAlive:false`,
      короткий idle timeout). Managed PG **не** pgBouncer по умолчанию:
  - Либо подключаться к встроенному пулеру YC (порт 6432) — тогда текущие настройки
    ок (transaction mode).
  - Либо прямое подключение (порт 6432/5432 хоста): вернуть `keepAlive:true`,
    `max` больше, обычный `idleTimeoutMillis`, можно вернуть `statement_timeout`.
- [ ] Добавить TLS: `ssl: { ca: fs.readFileSync(...CA.pem), rejectUnauthorized: true }`
      вместо `rejectUnauthorized:false` (теперь сертификат известен).
- [ ] `drizzle.config.ts` — обновить строку подключения.
- [ ] Убрать логику переключения портов 5432↔6543 (она специфична для Supabase pooler).

### 2.4 Переменные окружения
```
DATABASE_URL=postgresql://user:pass@<host>.mdb.yandexcloud.net:6432/bizmusic?sslmode=verify-full
DATABASE_DIRECT_URL=postgresql://user:pass@<host>:5432/bizmusic   # для миграций
```

---

## Фаза 3 — Декоммишн прокси и зачистка

- [ ] Удалить `src/app/api/storage-proxy/**` (route + diagnostic).
- [ ] Удалить `src/lib/storage-proxy.ts` и все вызовы `rewriteStorageUrl`
      (заменены прямыми YC-URL в Фазе 1).
- [ ] Удалить `src/utils/supabase/{client,server,admin}.ts` и пакеты
      `@supabase/supabase-js`, `@supabase/ssr` из `package.json`.
- [ ] Убрать обход блокировок Clerk через `clerk-proxy`? — **НЕТ**, Clerk остаётся,
      прокси Clerk не трогаем.

---

## Фаза 4 — Катовер и проверка

Порядок (минимальный простой):
1. Перенести файлы (Фаза 1.2) — данные только дописываются, простоя нет.
2. Выкатить код с двойной поддержкой ИЛИ в окно обслуживания.
3. Заморозить запись в БД (баннер «тех. работы»), финальный `pg_dump`,
   восстановить в YC, переключить `DATABASE_URL`, выкатить.
4. Прогнать чек-лист проверки.

### Чек-лист проверки после катовера
- [ ] Вход через Clerk (с VPN и **без** VPN).
- [ ] Загрузка каталога треков, профиля, статуса подписки **без VPN**.
- [ ] **Воспроизведение трека целиком** (>3.5 MB) — с VPN и без.
- [ ] Перемотка трека (Range-запросы → 206).
- [ ] **Скачивание трека** целиком (не обрезается).
- [ ] Загрузка нового трека админом.
- [ ] Генерация и скачивание лицензии (PDF).
- [ ] Экспорт CSV (compliance / legal-acceptance) — больше нет лимита 3.5 MiB.
- [ ] Платёжный вебхук + выдача лицензии.
- [ ] `/api/health` зелёный.

---

## Откат (rollback)
- Storage: старый бакет Supabase не удаляем минимум 2 недели. Откат = вернуть
  старые `SUPABASE_*` env и прежний `supabase-storage.ts` (тег в git).
- DB: Supabase-проект не удаляем минимум 2 недели. Откат = вернуть прежний
  `DATABASE_URL`. Поэтому на время катовера запись в БД замораживается, чтобы
  не было расхождения данных.
- Каждая фаза — отдельный PR с тегом, чтобы можно было откатить точечно.

---

## Порядок выполнения (рекомендация)
1. **Storage первым** — он и есть текущая боль (аудио 502, скачивание, прокси).
   Даёт самый большой эффект и не трогает БД.
2. **PostgreSQL вторым** — решает таймауты без VPN.
3. **Зачистка прокси/рудиментов** — после стабилизации.

> Оценка ресурсов и стоимость — в отдельном расчёте (грант YC). Этот документ —
> про технический план и изменения в коде.

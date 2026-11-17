# Import Manifest Format — Manaschy

Руководство по подготовке и запуску импорта нового контента в приложение.

---

## Что такое manifest

Manifest — это JSON-файл, описывающий один источник (книгу, рукопись, аудиозапись) и связанные с ним эпизоды и фрагменты. После валидации manifest импортируется в базу данных приложения через скрипт.

Manifest не заменяет экспертную проверку. Он — инструмент для структурированного добавления уже проверенного контента.

---

## Полная структура manifest

```json
{
  "sourceId":            "src-<org>-<performer>-<cycle>-<year>",
  "title":               "Полное название издания / источника",
  "cycleId":             "manas | semetey | seytek",
  "variantId":           "manas-sayakbay-karalaev",
  "performerOrCompiler": "Имя исполнителя или составителя",
  "publisher":           "Издательство / Архив / Организация",
  "year":                1958,
  "language":            "ky | ru | en | other",
  "sourceType":          "book | manuscript | audio | archive | website | research | other",
  "reliability":         "official | academic | archive | library | publisher | digital_copy | research | unknown",
  "rightsStatus":        "public_domain | permission_granted | citation_only | unknown | not_allowed",
  "verificationStatus":  "verified | needs_review | draft | placeholder | rejected | license_missing",
  "citationText":        "Полная библиографическая ссылка по ГОСТ или Chicago",
  "notes":               "Пояснение: почему разрешено использование, ссылка на документ о правах",

  "episodes": [
    {
      "id":               "manas-karalaev-001",
      "order":            1,
      "title":            "Название главы точно по оглавлению издания",
      "shortDescription": "Краткое описание 1-2 предложения",
      "text":             "Полный текст главы (только если rightsStatus разрешает)",
      "sourceIds":        ["src-<org>-<performer>-<cycle>-<year>"],
      "rightsStatus":     "public_domain | permission_granted",
      "sourceStatus":     "verified | needs_review | draft",
      "tags":             ["манас", "каралаев", "глава-1"],
      "fragments": [
        {
          "id":        "manas-karalaev-001-frag-001",
          "order":     1,
          "text":      "Фрагмент текста для AI/RAG поиска",
          "startTime": null,
          "endTime":   null
        }
      ]
    }
  ]
}
```

---

## Поля manifest

### Корневые поля

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `sourceId` | ✓ | Уникальный ID источника. Формат: `src-<org>-<performer>-<cycle>-<год>` |
| `title` | ✓ | Полное название книги/рукописи/записи |
| `cycleId` | ✓ | `manas`, `semetey` или `seytek` |
| `variantId` | ✓ | ID существующего варианта |
| `performerOrCompiler` | ✓ | Имя исполнителя (манасчи) или составителя |
| `publisher` | — | Издательство |
| `year` | — | Год издания |
| `language` | ✓ | `ky`, `ru`, `en`, `other` |
| `sourceType` | ✓ | Тип источника |
| `reliability` | ✓ | Уровень достоверности источника |
| `rightsStatus` | ✓ | Статус прав на использование |
| `verificationStatus` | ✓ | Статус верификации |
| `citationText` | ✓ | Полная библиографическая ссылка |
| `notes` | — | Пояснения, ссылка на документ о правах |

### Поля episode

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `id` | ✓ | Уникальный ID эпизода. Формат: `<cycleId>-<performerCode>-<NNN>` |
| `order` | ✓ | Порядковый номер из оглавления источника |
| `title` | ✓ | Название главы точно по изданию |
| `shortDescription` | ✓ | Краткое описание 1-2 предложения |
| `text` | ✓ | Полный текст (или placeholder если нет прав) |
| `sourceIds` | ✓ | Массив ID источников |
| `rightsStatus` | ✓ | Должен быть `public_domain` или `permission_granted` для текста |
| `sourceStatus` | ✓ | `verified` требует реального текста |
| `tags` | ✓ | Теги для поиска |
| `fragments` | ✓ (рек.) | Фрагменты для AI/RAG |

### Поля fragment

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `id` | ✓ | Уникальный ID. Формат: `<episodeId>-frag-<NNN>` |
| `order` | ✓ | Порядок фрагмента внутри эпизода |
| `text` | ✓ | Текст фрагмента (часть текста эпизода) |
| `startTime` | — | Метка времени начала в аудио (null если нет) |
| `endTime` | — | Метка времени конца в аудио (null если нет) |

---

## Допустимые значения полей

### `rightsStatus`

| Значение | Полный текст разрешён | Описание |
|---------|----------------------|---------|
| `public_domain` | ✓ ДА | Общественное достояние — авторское право истекло |
| `permission_granted` | ✓ ДА | Получено письменное разрешение правообладателя |
| `citation_only` | ✗ НЕТ | Только цитирование — полный текст запрещён |
| `unknown` | ✗ НЕТ | Права не определены — нельзя публиковать текст |
| `not_allowed` | ✗ НЕТ | Правообладатель явно отказал |

### `sourceStatus`

| Значение | Описание |
|---------|---------|
| `verified` | Текст проверен экспертом, источник подтверждён |
| `needs_review` | Требует экспертной проверки |
| `draft` | Черновик — в работе |
| `placeholder` | Заглушка без текста |

### `reliability`

| Значение | Описание |
|---------|---------|
| `official` | Официальный источник (ЮНЕСКО, НАН КР) |
| `academic` | Академическое издание |
| `archive` | Архивный источник |
| `library` | Библиотека |
| `publisher` | Издательство |
| `digital_copy` | Цифровая копия (не является автоматически legal) |
| `research` | Исследовательские материалы |
| `unknown` | Неизвестный источник |

---

## Почему `citation_only` нельзя использовать как полный текст

`citation_only` означает, что источник можно **цитировать** — ссылаться на него в библиографии, указывать название и автора. Это не означает права на воспроизведение полного текста.

Пример: ЮНЕСКО официально признаёт эпос «Манас» нематериальным культурным наследием. Это позволяет ссылаться на страницу ЮНЕСКО. Но право на воспроизведение конкретного академического издания принадлежит издательству / наследникам составителя.

**Правило скрипта:** Если `rightsStatus` в эпизоде не равен `public_domain` или `permission_granted`, скрипт отклонит импорт с полным текстом с ошибкой.

---

## Соглашения по именованию ID

### sourceId

```
src-<org>-<performer>-<cycle>-<year>

Примеры:
  src-nas-kr-karalaev-manas-1958
  src-nas-kr-orozbakov-manas-1960
  src-archive-mamay-manas-1984
```

### episodeId

```
<cycleId>-<performerCode>-<NNN>

Примеры:
  manas-karalaev-001
  manas-karalaev-002
  semetey-karalaev-001
```

### fragmentId

```
<episodeId>-frag-<NNN>

Примеры:
  manas-karalaev-001-frag-001
  manas-karalaev-001-frag-002
```

---

## Команды

### Dry-run (проверка без изменений)

```bash
npm run content:import -- --file data/manifests/my-manifest.json --dry-run
```

Dry-run:
- Читает manifest
- Запускает полную валидацию
- Показывает детальный отчёт
- **Не меняет ни один файл**
- Выводит предупреждения

### Реальный импорт

```bash
npm run content:import -- --file data/manifests/my-manifest.json
```

Реальный импорт:
- Запускает те же проверки
- При ошибках — останавливается, файлы не меняются
- При успехе — обновляет `src/data/epic/imported-index.ts` и `data/imported/registry.json`

### После импорта обязательно проверить

```bash
npm run content:validate
npm run sources:validate
npx tsc --noEmit
```

---

## Добавление первого реального источника — шаг за шагом

### 1. Проверьте существующие варианты

Убедитесь, что нужный `variantId` уже есть в `src/data/epic/variants.ts`:

```
manas-sayakbay-karalaev
manas-sagymbay-orozbakov
manas-jusup-mamay
semetey-sayakbay-karalaev
seytek-sayakbay-karalaev
```

Если варианта нет — добавьте его в `variants.ts` вручную перед импортом.

### 2. Подтвердите права

Перед заполнением manifest убедитесь:
- Если источник старше 70 лет (народное произведение до 1955 г.) — вероятно `public_domain`.
- Если получено письменное разрешение от НАН КР / издательства — `permission_granted`.
- Если неизвестно — НЕ заполняйте `text`, используйте `rightsStatus: "unknown"`.

### 3. Создайте manifest

Скопируйте `data/manifests/example-source-manifest.json` в новый файл:

```bash
cp data/manifests/example-source-manifest.json data/manifests/karalaev-manas-vol1.json
```

Заполните все поля по реальному источнику.

### 4. Проверьте dry-run

```bash
npm run content:import -- --file data/manifests/karalaev-manas-vol1.json --dry-run
```

Исправьте все ошибки и предупреждения.

### 5. Запустите импорт

```bash
npm run content:import -- --file data/manifests/karalaev-manas-vol1.json
```

### 6. Проверьте результат

```bash
npm run content:validate
npm run sources:validate
npx tsc --noEmit
```

### 7. Проверьте сгенерированный файл

Откройте `src/data/epic/imported-index.ts` и убедитесь, что:
- Текст корректный
- ID не конфликтуют
- `rightsStatus` и `sourceStatus` правильные

### 8. Закоммитьте все связанные файлы вместе

```
src/data/epic/imported-index.ts  ← сгенерированный
data/imported/registry.json      ← реестр импортов
data/manifests/karalaev-manas-vol1.json  ← исходный manifest
```

---

## Архитектура pipeline

```
data/manifests/<name>.json
       │
       ▼
scripts/content/import-manifest.ts
       │
       ├── Validation (все проверки)
       │
       ├── [dry-run] → отчёт, выход
       │
       └── [import]
             ├── обновляет data/imported/registry.json
             └── генерирует src/data/epic/imported-index.ts
                           │
                           ▼
                 src/data/epic/index.ts
                 (merges base + imported)
                           │
                           ▼
                   App + RAG service
                   (только verified +
                    public_domain/permission_granted)
```

---

*Обновлено: 2026-06-22*

# Free Gemini Epic Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить неудовлетворительно работающий локальный чат бесплатным Gemini с улучшенным поиском по оригиналу, проверяемыми ссылками и честным резервным режимом.

**Architecture:** Существующая Node-служба хранит ключ, индексирует оригинал и обращается к Gemini; Expo получает только безопасные статусы и проверенные результаты. Сначала выполняется локальный поиск, затем максимум два вызова модели; отсутствие ключа, квоты или сети не блокирует поиск по книге. Настройка ключа — отдельная защищённая loopback-страница, не часть клиентской сборки.

**Tech Stack:** Expo 56 / React 19.2 / React Native 0.85, Node 24, встроенные fetch/fs/crypto, существующие PDF.js, Zustand, Jest и node:test. Без новых зависимостей.

**Spec:** `docs/superpowers/specs/2026-09-29-free-gemini-chat-design.md` — подтверждён пользователем 29 сентября 2026 года.

**Execution:** Native: основной агент реализует задачи самостоятельно в текущей сессии, как поручил пользователь. План ожидает отдельного подтверждения; код и настройка ключа ещё не менялись.

## Global Constraints

- «Требуется бесплатная работа без включения billing, привязки карты, подписок, платного поиска и автоматического перехода на другой платный сервис.»
- «Основная модель — `gemini-3.6-flash`, подтверждённая в квотах проекта. Использовать официальный REST Interactions API, структурированный ответ и `store: false`.»
- «Не более двух вызовов модели на вопрос, без скрытых циклов и автоматических повторов при ошибках.»
- «Весь модельный запрос ограничен 30 секундами»; контекст — до 6 фрагментов / 9 000 символов, ответ — 2–4 предложения.
- «Кэшировать только структурно проверенные успешные ответы в памяти: до 50 записей, срок 30 минут.» Ключ включает вопрос, язык, историю, модель и версию корпуса.
- «Ограничить модельные обращения максимумом 5 за скользящую минуту в рамках этого процесса.» 20 RPD — наблюдение квоты Google, не обещание числа ответов.
- «Ключ сохраняется только в игнорируемом файле `tmp/chat/gemini.local.json`, без вывода в журналы, ответы API, URL, скриншоты или переписку.» Не использовать чужие глобальные ключи и не создавать новые.
- «Использовать существующие Expo 56, Node и fetch без добавления SDK.» Перед кодом прочитать https://docs.expo.dev/versions/v56.0.0/.
- Сохраняются 2 149 страниц, границы эпизодов, RU/KY, поле свободного вопроса, история в памяти и отмена. Никаких загрузок всего корпуса в Google, публичной публикации, нового веб-поиска или скачивания моделей.
- Текущая ветка `feature/local-epic-chat` и рабочая копия сохраняются. До изменений зафиксировать исходный dirty status; смешанные пользовательские файлы не коммитить целиком. Коммиты — только явно перечисленные собственные пути через `git commit --only -- <paths>` после проверки diff; не использовать `git add .`.

## Review Focus

1. Враждебная веб-страница пытается записать или прочитать ключ: same-origin, CSRF, отсутствие CORS и секретов в ответах — Task 1.
2. Русский пересказ и кыргызское отрицание приводят к другой сцене; упоминание только в заголовке теряется — Task 2 и фактическая серия Task 6.
3. Два вызова на вопрос расходуют квоту быстрее ожидаемого; 429, сбой и отмена не запускают скрытые повторы — Tasks 3–4.
4. Правильная страница сопровождается выдуманной цитатой или смыслом: сервер проверяет цитату, независимая фактическая проверка оценивает смысл — Tasks 4 и 6.
5. Ответ из кэша относится к старому уточнению, другому языку или очищенному чату; fallback выглядит как ответ ИИ — Tasks 4–5.

## File Structure

| Ответственность | Пути |
| --- | --- |
| Настройка ключа | новые `scripts/reader/chat-config.mjs`, `chat-setup.mjs`, `chat-setup.html`; существующий `server.mjs` |
| Поиск | новый `scripts/reader/chat-queries.mjs`; существующий `chat-index.mjs` |
| Gemini и общий контракт | новые `scripts/reader/chat-gemini.mjs`, `chat-protocol.mjs`; существующий `chat-ollama.mjs` сохраняет совместимые экспорты для старых тестов |
| Ответ, кэш, HTTP | существующие `chat-answer.mjs`, `chat-http.mjs`, `server.mjs`, `scripts/start.mjs` |
| Клиент и приватность | `src/features/chat/{types,api,store,messages}.ts`, `chat-screen.tsx`, `src/i18n/{ru,ky}.ts` |
| Проверки | новые `tests/reader/{chat-config,chat-setup,chat-queries,chat-gemini}.test.mjs`; существующие chat/index/server/API/store/screen/legal tests |
| Передача результата | новый `docs/FREE_CHAT_VERIFICATION.md`; обновление `README.md`, `docs/AI_API_PLAN.md`, `docs/EPIC_READER.md` |

### Task 1: Защищённая локальная настройка ключа

**Files:** новые config/setup/HTML и их tests из таблицы; интеграция `scripts/reader/server.mjs`.

**Interfaces:**
- `createChatConfig({ file = new URL('../../tmp/chat/gemini.local.json', import.meta.url) } = {})` → `{ getApiKey(): string|null, getStatus(): 'configured'|'missing'|'invalid', saveOnce({apiKey, freeTierConfirmed}): Promise<void> }`. Файл `{version:1, apiKey, freeTierConfirmed:true, model:'gemini-3.6-flash'}`; не следовать symlink/reparse-point цели или её каталога и отказывать при уже существующем файле. getStatus/getApiKey перечитывают файл, чтобы настройка вступала в силу без перезапуска.
- `createChatSetupHandler({config, now = Date.now, token = () => randomBytes(32).toString('hex')})` → async `(request, response): Promise<boolean>`. Только GET/POST `/chat/setup`; false для других путей. HTML содержит одноразовый CSRF-токен со сроком 5 минут. POST принимает строго `{apiKey, freeTierConfirmed:true, csrfToken}`.
- `createReaderServer({readPage, chat, setup})` передаёт настройке только её путь после проверки Host; точный same-origin POST определяется по разрешённому Host и реальному локальному порту. Для setup не включать общий Expo CORS.

- [ ] **Step 1 — RED:** добавить тесты `saves once without leaking`, `rejects invalid config and overwrite`, `setup is same-origin and token bound`. Создавать только временную директорию теста через `mkdtemp`, синтетический ключ длиной 48 символов. Проверки: после save `getApiKey() === syntheticKey`; сериализованный status и все HTTP-ответы не содержат ключ; повторная запись и существующий повреждённый файл отклоняются без изменения байтов. Для HTTP: GET не содержит ключ; POST с Origin чужого сайта, `null`, отсутствующим Origin, без токена, с повторным/просроченным токеном или text/plain отклоняется. Два конкурентных POST не перезаписывают первый результат; тест symlink должен сохранить файл-мишень.

  Ключевые assertions для config с временным file и syntheticKey:
  ```js
  assert.equal(config.getStatus(), 'missing');
  await config.saveOnce({apiKey: syntheticKey, freeTierConfirmed: true});
  assert.equal(config.getApiKey(), syntheticKey);
  assert.equal(config.getStatus(), 'configured');
  await assert.rejects(config.saveOnce({apiKey: syntheticKey, freeTierConfirmed: true}));
  assert.ok(!JSON.stringify(config.getStatus()).includes(syntheticKey));
  ```
- [ ] **Step 2:** `node --test tests/reader/chat-config.test.mjs tests/reader/chat-setup.test.mjs` → ожидаемые FAIL из-за отсутствующих модулей/поведения.
- [ ] **Step 3 — Implement:** тело настройки ≤4 096 байт, чтение ≤10 секунд, ключ 32–256 непустых ASCII-символов без пробелов/управляющих символов, boolean подтверждения тарифа строго true. Использовать эксклюзивное создание, не печатать содержимое ошибок fs. CSP с nonce для собственного скрипта, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Cache-Control: no-store`, Referrer-Policy no-referrer. UI — password input, локальное подтверждение Free tier, запрет автозаполнения и очистка поля после отправки. Сохранять ключ без исходящих вызовов Google. Не копировать настоящий ключ на этом шаге.
- [ ] **Step 4 — GREEN:** повторить тесты и `node --test tests/reader/server.test.mjs`. Проверить отсутствие расширения прав обычных маршрутов; неподдерживаемый метод setup →405, переполнение →413, неверный Origin/CSRF →403, повторная настройка →409, успешная →201.
- [ ] **Step 5:** просмотреть diff; коммит только новых config/setup/HTML/tests. Смешанный `server.mjs` оставить в рабочей копии с отмеченным изменением интеграции.

### Task 2: Двуязычный поиск и раздельные группы контекста

**Files:** `chat-queries.mjs`, `chat-index.mjs`; tests `chat-queries.test.mjs`, `chat-index.test.mjs`.

**Interfaces:**
- `buildSearchQueries(question: string): string[]` → исходный вопрос плюс до четырёх детерминированных вариантов с проверенными именами/терминами. Не генерирует факты и не обращается к сети. Нормализация текста поиска не изменяет оригинал.
- Сохранить `createEpicIndex`, `prepare`, `getStatus`, `search(queries, limit=30)` и прежний `selectContext` для совместимости. Добавить `selectGroupedContext(hits): Array<Chunk & {groupId:string}>`, максимум две группы по три соседних фрагмента, суммарно 6 / 9 000 символов. Внутри группы — один episodeId и соседние страницы; разные сцены не сливаются в один текст.
- `search` оценивает формулировки независимо, затем объединяет рейтинги reciprocal-rank fusion с константой 60; исходный вопрос сохраняется. Заголовки участвуют в поисковых postings отдельно от текста, поэтому совпадение только в заголовке тоже даёт кандидата.

- [ ] **Step 1 — RED:** тесты `keeps negation`, `normalizes character variants`, `heading-only match is discoverable`, `irrelevant expansion cannot suppress original`, `groups remain contiguous`. Проверки: «Жакып, нет детей» имеет вариант с `Жакып` и `баласы жок`, но не `өлгөн`; «умер сын» не преобразуется в бездетность; «Кокотой» сопоставляется с `Көкөтөй`. Синтетический heading `Кошой менен Жолойдун күрөшкөнү` на странице 194 находится по `күрөш` даже при отсутствии слова в теле. Нерелевантная дополнительная формулировка не удаляет исходный hit из top 30. У групп уникальные IDs, не более 6 элементов и 9 000 символов; одна группа не захватывает страницу 51 рядом со страницей 11.

  ```js
  assert.ok(buildSearchQueries('Жакып, нет детей').some(q => /баласы жок/iu.test(q)));
  assert.ok(buildSearchQueries('Жакып, нет детей').every(q => !/өлгөн/iu.test(q)));
  assert.equal(index.search(['күрөш'])[0].chunk.page, 194); // heading-only fixture
  const context = index.selectGroupedContext(index.search(['күрөш']));
  assert.ok(context.length <= 6);
  assert.ok(context.reduce((sum, c) => sum + c.text.length, 0) <= 9000);
  ```
- [ ] **Step 2:** `node --test tests/reader/chat-queries.test.mjs tests/reader/chat-index.test.mjs` → FAIL на новых требованиях, не на повреждённой фикстуре.
- [ ] **Step 3 — Implement:** словарь относится к поиску, не к готовым ответам: варианты имён из каталога, формы рождения/бездетности/поминок/борьбы/похода. Сначала длинные отрицательные фразы, затем слова; не заменять совпадения внутри несвязанных слов. Для групп взять лучший anchor и соседей; второй anchor не должен повторять уже включённые фрагменты. Оригинал и metadata оставить неизменными. Не копировать корпус в исходники и не добавлять сетевую библиотеку.
- [ ] **Step 4 — GREEN:** повторить новые и прежние тесты индекса, включая 2 149 страниц в реальной подготовке позднее. Старый contiguous-context тест остаётся для старого `selectContext`; новый метод проверяется отдельно.
- [ ] **Step 5:** коммит только query/index и их tests после diff.

### Task 3: Gemini REST-клиент с жёсткими ограничениями

**Files:** новые `chat-protocol.mjs`, `chat-gemini.mjs`, `tests/reader/chat-gemini.test.mjs`; небольшой совместимый перенос `chatFailure` в `chat-ollama.mjs`.

**Interfaces:**
- `chatFailure(code, retryAfterSeconds?)` из protocol — безопасная ошибка без upstream-текста. Старый Ollama реэкспортирует её; старый клиент не становится автоматическим fallback.
- `createGeminiClient({config, fetchImpl=fetch, now=Date.now})` → `{ modelName:'gemini-3.6-flash', getStatus(): Promise<ModelState>, generate(request, context, signal): Promise<ModelTurn> }`.
- `ModelState` = `{model:'configured'|'missing'|'limited'|'unavailable', modelError?:string, retryAfterSeconds?:number}`. configured означает наличие локальной настройки, не обещание доступности сервиса. getStatus не генерирует запросы и не расходует квоту.
- `ModelTurn` = `{status:'answered'|'clarify'|'not_found'|'search', answer:string, evidence:Array<{sourceId:string, quote:string}>, queries:string[]}`. Максимум 6 evidence, каждая quote 1–240 символов; queries максимум 2 по 200 символов. answered требует непустого answer и evidence; search — queries, без answer/evidence; clarify — один вопрос без evidence/queries; not_found — без evidence/queries. Общий answer ≤6 000 символов, пустой допустим только search/not_found.
- Фиксированный URL `https://generativelanguage.googleapis.com/v1beta/interactions`; `x-goog-api-key`, `store:false`, `stream:false`, `service_tier:'standard'`, без tools/Files API/previous_interaction_id. `response_format` text/application-json/schema. Полезный текст REST-ответа извлекать из `steps` типа `model_output` / content типа `text`, не из SDK-only `output_text`.

- [ ] **Step 1 — RED:** mocked fetch тесты: правильные URL/header/body/model/store; отсутствующий config даёт `KEY_MISSING` при нуле fetch; 401/403→`KEY_INVALID`, 404→`MODEL_UNAVAILABLE`, 429→`QUOTA_EXCEEDED`, 5xx/сеть→`MODEL_UNAVAILABLE`; upstream body с syntheticKey нигде не отражается. При 5 вызовах за 60 секунд шестой блокируется без fetch; после окончания окна разрешается. Проверить Retry-After и что второй запрос внутри cooldown не идёт в сеть.

  Зафиксировать mock-запрос и REST-ответ `status: 'completed', steps: [{type: 'model_output', content: [{type: 'text', text: JSON.stringify(modelTurn)}]}]`; assertions:
  ```js
  assert.equal(sentUrl, 'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.equal(sentBody.model, 'gemini-3.6-flash');
  assert.equal(sentBody.store, false);
  assert.equal(sentBody.stream, false);
  assert.equal(sentHeaders['x-goog-api-key'], syntheticKey);
  assert.equal(sentBody.tools, undefined);
  assert.equal(result.status, modelTurn.status);
  ```
- [ ] **Step 2:** `node --test tests/reader/chat-gemini.test.mjs` → FAIL.
- [ ] **Step 3 — Implement:** максимум 65 536 байт ответа, redirect:error, AbortSignal, никаких повторов. При malformed/too-large JSON, status не completed, tool output, отсутствии model text или неправильном ModelTurn — `INVALID_MODEL_RESPONSE`. Данные и источники — не инструкции; история ограничена последними 8 сообщениями / 4 000 символами, каждое ≤2 000. Пустой context разрешает только search/clarify/not_found. `generation_config`: thinking_level low, max_output_tokens 1 500. Retry-After число секунд или HTTP-дата, безопасный предел до 86 400 секунд; при отсутствии корректного значения cooldown 60 секунд. Лимит учитывает каждую начатую попытку, включая ошибки.
- [ ] **Step 4 — GREEN:** `node --test tests/reader/chat-gemini.test.mjs tests/reader/chat-ollama.test.mjs`. Добавить точные проверки truncated/incomplete, неправильной схемы, отмены до запроса и во время чтения. Только синтетические данные, настоящую квоту не тратить.
- [ ] **Step 5:** коммит protocol/Gemini/Ollama compatibility и их tests после diff.

### Task 4: Поиск → ответ → проверка источников → резервный режим

**Files:** `chat-answer.mjs`, `chat-http.mjs`, `server.mjs`, `scripts/start.mjs`; tests `chat-answer.test.mjs`, `chat-http.test.mjs`, `server.test.mjs`.

**Interfaces:**
- `createChatAnswerer({index, model, now=Date.now, timeoutMs=30000, corpusVersion})` → `ask(request, callerSignal): Promise<ChatReply>`. Без переданного corpusVersion вычислять SHA-256 байтов существующего `src/data/epic/catalog.json`, содержащего хеши PDF. timeoutMs существует для тестов; production всегда 30 000.
- `ChatSource` сохраняет id/episodeId/title/volume/page/href и добавляет `quote?:string` (≤240). `ChatReply` = `{status:'answered'|'clarify'|'not_found'|'search_results', answer:string, sources:ChatSource[], reason?:FallbackReason, retryAfterSeconds?:number}`. `FallbackReason` = `KEY_MISSING|KEY_INVALID|QUOTA_EXCEEDED|MODEL_TIMEOUT|MODEL_UNAVAILABLE|INVALID_MODEL_RESPONSE|UNCONFIRMED`. reason допустим только search_results/not_found. answered имеет 1–6 источников с quote; clarify/not_found — без источников; search_results — 1–6 найденных мест, не утверждения ИИ.
- `/chat/status` и `/chat/prepare` сохраняют поля индекса, добавляют `provider:'gemini'` и ModelState из Task 3. Подготовка индекса не зависит от модели. `/chat/messages` сохраняет вход question/locale/history и прежние границы; ключи, URL провайдера и system role во входе запрещены.
- Сохранить `createChatHttpHandler({index, model, answerer, now} = {})`; новый default model — Gemini, не Ollama. Для production `createReaderServer` создаёт один config из Task 1 и передаёт его setup-handler и Gemini-клиенту; явные зависимости тестов имеют приоритет над defaults.
- `/health`: version 3, capabilities `['reader','chat','gemini','search-fallback']`; start.mjs отказывает старому version 2 без автоматического убийства процесса.

- [ ] **Step 1 — RED:** обновить фикстуры answerer на generate/getStatus; тесты: локальный поиск до первого generate, один вызов при answered, максимум два при search, ноль вызовов без ключа, no-context не создаёт ответ. Проверки fallback при всех FallbackReason, 30s budget, caller cancellation без fallback и без записи в кэш. На второй search не выполнять третий вызов. HTTP prepare запускается без ключа; messages возвращает search_results при готовом индексе и missing model, а не 503.

  Assertions для существующей answerer fixture, расширенной возвращаемым счётчиком `calls` и контролируемым model result:
  ```js
  assert.equal(reply.status, 'answered');
  assert.equal(reply.sources[0].href, '/episode/orozbakov-v2-001?page=123');
  assert.equal(calls, 1);
  // Отдельная fixture: getStatus() сообщает missing, индекс содержит один hit.
  assert.equal(fallback.status, 'search_results');
  assert.equal(fallback.reason, 'KEY_MISSING');
  assert.equal(fallbackCalls, 0);
  ```
- [ ] **Step 2:** `node --test tests/reader/chat-answer.test.mjs tests/reader/chat-http.test.mjs tests/reader/server.test.mjs` → FAIL на новом поведении.
- [ ] **Step 3 — Implement:** искать buildSearchQueries(question), selectGroupedContext; дополнительный поиск только по исходному вопросу и проверенным queries первого ModelTurn. При отсутствии новых фрагментов не расходовать второй вызов. Проверять sourceId в переданном context, episode/page/volume по каталогу и непрерывное вхождение quote в исходный текст после нормализации только Unicode NFC и пробельных последовательностей. Не исправлять слова цитаты и не считать title доказательством. Ссылки строить сервером; дедупликация по sourceId. Ошибка проверки ответа → обозначенный fallback, а не показ недостоверного текста.
- [ ] **Step 4 — Implement cache/fallback:** до 50 LRU-записей / 1 800 000 мс, только answered после проверки. SHA-256 ключа от question/locale/ограниченной history/modelName/corpusVersion, клон результата при чтении; ошибки/отмена/fallback не кэшируются. Резервные источники — из локального поиска, quote — первые ≤240 символов исходного фрагмента. Если совпадений нет, not_found с причиной и формулировкой «не удалось найти», не «этого события не существует». UI-текст ответа короткий RU/KY; нет скрытого перехода на Ollama. Сохранить HTTP body 32 КБ, 10s чтение, 12 сообщений/мин, запрет конкурентных генераций и освобождение busy после отмены.
- [ ] **Step 5 — GREEN:** тесты источников: invented ID, допустимая страница с чужой quote, пустая evidence, title-only quote отклоняются; эквивалентные пробелы допустимы. Cache: повтор без fetch, другой язык/история/корпус — miss, 51-я запись вытесняет старую, expiry через 30 минут, отменённый запрос не сохраняется. Запустить команды Step 2 и все reader tests, проверить отсутствие секретов в status/error/fallback.
- [ ] **Step 6:** коммит только собственных chat-answer/http/tests; смешанные server/start не коммитить целиком. Зафиксировать их изменения в рабочем журнале реализации.

### Task 5: Интерфейс Gemini и честный режим поиска

**Files:** chat types/api/store/messages/screen, RU/KY privacy; tests chat-api/chat-store/chat-screen/legal-pages; README и AI_API_PLAN/EPIC_READER.

**Interfaces:** клиент использует ChatReply/ChatSource/ModelState из Task 4 как TS-типы, строго проверяя каталог и пределы. `ChatMessage` дополнительно хранит reason/retryAfterSeconds; sendChat/getChatStatus/prepareChat и store submit/stop/reset сохраняют сигнатуры. Клиентский timeout для messages —35 000 мс; серверный —30 000. API setup не включать в этот клиент.

- [ ] **Step 1 — RED:** UI-тесты «готовый индекс + missing model позволяет отправить вопрос», «search_results показан как Найденные места», «429 reason и retryAfter видны, ссылки работают», «answered содержит цитату», «перед отправкой видна передача Google». API отвергает unknown reason/provider/status, неверный href/page, quote>240 и answered без источника; store сохраняет metadata и исключает поздний результат после stop/reset. Обновить RU/KY legal test: Google/вопросы/отрывки/бесплатный тариф присутствуют, утверждения об отсутствии облачного API нет.

  Для screen fixture с готовым индексом/missing model и введённым вопросом:
  ```ts
  expect(screen.getByRole('button', {name: 'Отправить'}).props.accessibilityState.disabled).toBe(false);
  // После отправки mock search_results:
  expect(await screen.findByText('Найденные места')).toBeTruthy();
  expect(screen.getByText(/Объяснение ИИ недоступно/)).toBeTruthy();
  ```
- [ ] **Step 2:** `npm run test:ci -- --runTestsByPath tests/services/chat-api.test.ts tests/state/chat-store.test.ts tests/screens/chat.test.tsx tests/screens/legal-pages.test.tsx` → FAIL.
- [ ] **Step 3 — Implement:** ready определяется готовностью индекса, не модели; отсутствие ключа или cooldown показывать неблокирующим сообщением. Первый status сообщает настройку, не проверенную достоверность. Ввести подписи RU «ИИ · Gemini», «Найденные места», «Объяснение ИИ недоступно; показываю результаты поиска», KY «ИИ · Gemini», «Табылган үзүндүлөр», «ИИ түшүндүрмөсү жеткиликсиз; издөө натыйжалары көрсөтүлдү». Сохранить предупреждение об экспериментальности до фактической проверки. Не показывать «несколько минут»; показывать поиск/ожидание с отменой. Цитаты выводить как текст, не HTML, источники открывать прежним reader route. Сохранить Enter/Shift+Enter/IME, масштаб текста и адаптивность.
- [ ] **Step 4 — GREEN:** повторить Step 2, затем `npm run typecheck` и `npm run lint`. Обновить документацию: новый провайдер, бесплатные ограничения, переход к локальному поиску, ключ на сервере, отсутствие постоянной истории, обработка Google и ограничения корпуса. Прежний отчёт LOCAL_CHAT_VERIFICATION не стирать и не объявлять его провал исправленным без Task 6.
- [ ] **Step 5:** коммит только собственных chat-файлов/tests. Смешанные README/локализации/legal tests и прежние untracked docs сохранить без захвата чужих изменений.

### Task 6: Настоящее подключение и приёмка

**Files:** новый `docs/FREE_CHAT_VERIFICATION.md`; рабочий журнал и статусы плана. Секрет — только игнорируемый путь Task 1, не артефакт коммита.

**Interfaces:** реальный Google AI Studio → защищённая `/chat/setup` → `/chat/status` → `/chat/messages` → `/episode/:id?page=N`. Браузерные действия только через разрешённый Computer Use после чтения его навыка. Не обращаться к паролям, не менять billing или настройки безопасности.

- [ ] **Step 1:** `npm run check`, `npm run export:web`, `npm run export:verify` → все команды exit 0. Проверить `git check-ignore tmp/chat/gemini.local.json`. Целевой smoke-check `rg -l 'createGeminiClient|x-goog-api-key|gemini\.local\.json' dist -g '*.js'` должен дать exit 1 (нет совпадений); найденные пути расследовать до настройки ключа. После настройки отдельно проверить значение ключа против JS-файлов сборки внутри Node-процесса: прочитать фиксированный config, сравнить строки, вывести только boolean «совпадение есть/нет», не содержимое ключа или файла. Это целевая проверка, не формальное доказательство отсутствия любых секретов. Перезапустить только установленный read-only проверкой процесс этого reader; не останавливать Ollama и посторонние приложения.
- [ ] **Step 2:** открыть существующий AI Studio через наблюдаемый браузер, подтвердить Free tier и модель/квоту. Если вход исчез, передать вход пользователю. Если существующий ключ недоступен или тариф уже платный — не создавать новый ключ и не включать оплату, оставить работоспособный локальный поиск и сообщить ограничение.
- [ ] **Step 3:** при доступном существующем ключе нажать Copy API key, считать только результат этого копирования в переменную браузерной сессии, не выводя её. Ввести непосредственно в password input `/chat/setup`, подтвердить наблюдённый бесплатный тариф и сохранить. После отправки очистить буфер только если он по-прежнему равен скопированному ключу, затем очистить секретную переменную и поле. Проверить configured без чтения файла в вывод и без экспорта секретной страницы.
- [ ] **Step 4:** до генерации сверить контрольные факты по локальному reader: Жакып — бездетность, не смерть сына; богатство без наследника; Кошой/Жолой; ещё по одному моменту из томов 2 и 3 с точными страницами. Добавить KY-вопрос, неоднозначное местоимение и вымышленную ракету. Выполнить серию через настоящий HTTP последовательно с учётом 5 вызовов/мин; не делать параллельные браузерные генерации и не обходить 429. В отчёт записать вопросы, ответ, source IDs, время и оценку смысла, без полных книг и ключей. При исчерпании квоты прекратить модельные вызовы, закончить технические/fallback проверки; не объявлять непроверенные случаи прошедшими.
- [ ] **Step 5:** браузером проверить один успешный ответ → источник → назад, stop/reset, поиск без генерации (mock в тестах для 429, не искусственное расходование квоты), desktop и 390×844; вернуть viewport. Если ответов нет из-за квоты, явно отметить непроверенный успешный путь. Цель ≤10 секунд оценивается по серии; 30-секундное ожидание не считается достигнутой скоростью.
- [ ] **Step 6:** итоговый review согласно executing-plans/requesting-code-review после финального diff; исправления — только по конкретным дефектам. Новый отчёт разделяет технические тесты, поиск, фактические ответы, скорость и непроверенные пункты. При ошибках смысла сохранить экспериментальный статус. Коммитить только отчёт и собственные итоговые изменения; не push/merge, не стирать старый журнал или пользовательские файлы.

## Self-Review / Handoff

- [x] Спецификация покрыта Tasks 1–6; счётчик квоты относится к вызовам модели, не сообщениям чата.
- [x] Настройка ключа не имеет CORS-доступа со сторонней страницы и не читает ключ обратно; mock-тесты предшествуют реальному подключению.
- [x] Контракты ModelTurn, ChatReply, ChatSource и ModelState согласованы между задачами; REST steps не спутаны с полем SDK.
- [x] Пять рисков Review Focus включены в конкретные тестовые шаги; фактическая проверка не заменена HTTP 200 или валидностью URL.
- [x] Сохранён выбранный пользователем самостоятельный метод исполнения. Ни реализация, ни копирование ключа не начаты до проверки этого плана.

Первичные ссылки: [Expo 56](https://docs.expo.dev/versions/v56.0.0/), [Interactions API](https://ai.google.dev/api/interactions-api), [Gemini 3.6 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash), [квоты](https://ai.google.dev/gemini-api/docs/rate-limits), [обработка бесплатных запросов](https://ai.google.dev/gemini-api/terms#unpaid-services). При исполнении перепроверить документацию, не менять провайдера/модель без согласования, если интерфейс или доступность изменились.

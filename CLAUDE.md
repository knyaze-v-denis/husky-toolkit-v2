@AGENTS.md

# Husky Toolkit v2 — Project Context

## Что за проект

Инструмент для дизайн-команды SimpleOne. Помогает оценивать задачи перед проектированием.
Миграция с HTML/JS (оригинал: `/Users/denisknyazev/Documents/Projects/husky-toolkit`) на Next.js.

**Три модуля:**
- **Builder** — 4-шаговый визард: опросник → артефакты → оценка ЭБ → итог
- **Checklists** — чек-листы US / UC / Expert
- **AI Audit** — аудит описания задачи через Anthropic API

## Стек

- Next.js 16.2.9 (App Router, Turbopack)
- React 19, TypeScript
- CSS Modules (без UI-библиотек)
- lucide-react (иконки)

---

## Соглашения

### Общие
- Общаемся только на русском
- Комментарии в коде не пишем
- Не добавляем фичи и абстракции сверх задачи

### Компоненты
- Все кнопки — через `<Button>` из `components/ui/Button.tsx`
  - Варианты: `variant="primary | secondary | ghost"`, `size="md | sm"`
  - `size="sm"` — для компактных кнопок в шапке (Сбросить, Новый аудит)
- Активные состояния (фон строки + цвет чекбокса/радио) — через CSS vars `--active-bg` и `--active-color` на родительском `.block`
- `hexToRgba` — только из `lib/utils.ts`, не объявлять локально

### CSS
- Не создавать новые классы если можно использовать существующие
- Базовый стиль карточки — через `composes: block from '../ui/Block.module.css'`
- CSS-переменные в `globals.css`:
  - `--bg: #f7f7f5` — фон страницы
  - `--primary: #3C3489` — основной фиолетовый
  - `--primary-hover: #534AB7` — hover primary
- Хардкод `#3C3489`, `#f7f7f5`, `#534AB7` в CSS недопустим — только через переменные

### Данные и типы
- Все типы и данные — в `lib/data/builder.ts` и `lib/data/checklists.ts`
- `STATUS_LABEL`, `STATUS_CLASS` — только из `lib/data/builder.ts`
- Статусы артефактов (req/opt/no) — стили только из `components/ui/ArtStatus.module.css`

---

## Архитектура

```
app/
  layout.tsx             # root layout с Sidebar
  globals.css            # CSS vars, reset, body
  builder/page.tsx       # визард (stickyWrap + шаги)
  checklist/{us,uc,ex}/  # страницы чек-листов
  audit/page.tsx
  api/audit/route.ts     # Anthropic API endpoint

components/
  ui/
    Button.tsx / .module.css      # primary | secondary | ghost, size md | sm
    Badge.tsx / .module.css       # default | req | opt | score-sm/md/lg
    Banner.tsx / .module.css      # info | ok | warn | bad
    Block.module.css              # базовый .block (только CSS, компонент удалён)
    ArtStatus.module.css          # .artStatus.req/opt/no — общий для Step*
  layout/
    Layout.tsx / Sidebar.tsx
  builder/
    PageHeader.tsx                # sticky шапка с прогрессом, badge, banner, stats
    ProgressSteps.tsx             # 4 шага визарда
    StepQuestions / StepArtifacts / StepEB / StepResult
  checklist/
    ChecklistView.tsx
  audit/
    AuditView.tsx

lib/
  utils.ts              # hexToRgba
  data/
    builder.ts          # типы, QUESTIONS, BUILDS, RISK_GROUPS, STATUS_LABEL/CLASS, утилиты
    checklists.ts       # CHECKLISTS
  hooks/
    useBuilder.ts       # состояние визарда (localStorage)
    useChecklist.ts     # состояние чек-листов (localStorage)
    useAudit.ts         # состояние аудита (localStorage + API)
    useLocalStorage.ts
```

### Ключевые паттерны

**Блоки с цветным заголовком (StepEB, ChecklistView):**
```tsx
<div className={styles.block}
  style={{ '--active-bg': hexToRgba(color, 0.3), '--active-color': tc } as CSSProperties}>
  <div className={styles.blockHead} style={{ background: color, color: tc }}>…</div>
</div>
```
Opacity для `--active-bg`: 0.2 для блока «Объём работ» (всегда активен), 0.3 для остальных.

**Группа рисков «Исследование»:**
Помечена `radio: true` в `RISK_GROUPS` — рендерится как radio, не checkbox.
В `onRisk` для таких групп всегда передаётся `isNone=true` (взаимоисключающий выбор без изменения хука).

**Карточка билда (StepArtifacts, StepResult):**
```
buildLabel (мелкий uppercase)
buildNameRow → buildName (22px 700) + buildTypeBadge (бейдж)
buildDesc/buildRange (13px, opacity 0.8)
```

**Карточка ЭБ (StepResult):**
```
ebLabel (мелкий uppercase)
ebSize (22px 700) — SM/MD/LG
ebTime (13px, opacity 0.8) — "до 1 недели"
```

---

## Соглашения по чек-листам

- `PageHeader` поддерживает проп `disclaimer?: { text, variant }` — рендерится сразу под `.hdr`, внутри sticky-шапки, до статусного баннера
- Дисклеймеры: US/EX → `variant="warn"` (жёлтый), UC → `variant="info"` (синий)
- Прогресс в statsLeft: только "X из Y критериев", без процентов и разделов
- Badge в шапке чек-листов не используется
- Обязательные пункты (только UC): красная точка-суперскрипт `.reqDot` после текста
- Баннер UC — 3 состояния: warn (есть невыполненные обязательные) → info (обязательные выполнены) → ok (всё выполнено)
- Баннер US/EX — 2 состояния: null → ok (все выполнены)
- Кнопка PDF есть во всех чек-листах (`window.print()`), рядом с "Сбросить"

---

## Лог итераций

### 2026-06-26 — Рефакторинг: устранение дублирования

**Критичные правки:**
- `hexToRgba` вынесена в `lib/utils.ts` (была в StepEB и ChecklistView)
- `STATUS_LABEL` / `STATUS_CLASS` вынесены в `lib/data/builder.ts` (были в StepArtifacts и StepResult)
- `.artStatus` CSS вынесен в `components/ui/ArtStatus.module.css` (был продублирован в двух модулях)

**Средние правки:**
- `Block.module.css` стал единым источником `.block` — все компоненты используют `composes`
- `Block.tsx` удалён (нигде не использовался)
- CSS-переменные `--bg`, `--primary`, `--primary-hover` добавлены в `globals.css`, хардкоды заменены

**Единообразие между модулями:**
- `Button size="sm"` добавлен для компактных кнопок (Сбросить, Новый аудит)
- `runBtn` в AuditView → `<Button variant="primary">`
- `resetBtnSm` / `resetBtn` → `<Button variant="secondary" size="sm">`
- `.card` в StepQuestions → `composes: block`

**UI-правки визарда:**
- Группа рисков «Исследование» переведена на radio (2 взаимоисключающих варианта)
- `ebTime` в карточке ЭБ: 22px 700 → 13px opacity 0.8 (как описание билда)
- Тип билда (Дизайн-история/Подзадача) → бейдж в одну строку с названием билда

### 2026-06-26 — Доработка чек-листов

- `disclaimer` проп добавлен в PageHeader (рендерится внутри sticky-шапки после заголовка)
- US/EX: жёлтый дисклеймер о статусе документа; нет обязательных пунктов; простой баннер
- UC: синий дисклеймер о роли дизайнера; расширенный баннер 3 состояния; обязательные пункты с красной точкой-суперскриптом вместо ★
- Прогресс упрощён: "X из Y критериев", убраны проценты и счётчик разделов
- Badge с каунтером убран из шапки всех чек-листов
- Кнопка PDF добавлена во все чек-листы

### 2026-06-26 — Модуль AI Audit (роутинг, шапка, UI)

**Роутинг:**
- `/audit` — список, `/audit/new` — форма, `/audit/[id]` — отчёт
- `[id]/page.tsx` — серверный компонент (`async`/`await params`); `isFresh` передаётся через `searchParams`, без `useSearchParams` в клиенте
- `AuditReportClient` — отдельный клиентский компонент без Suspense (убирает задержку рендера, чинит sticky)

**PageHeader:**
- Добавлен проп `below?: ReactNode` — рендерится внутри sticky-обёртки после основного контента шапки
- Используется в аудите для вставки строки заголовка страницы в sticky-блок

**Структура карточки заголовка (`titleCard`):**
- `composes: block` — белая карточка с бордером, `padding: 10px 14px`
- `titleCardTop` — строка кнопок над заголовком: «← К списку» (иконка+текст) слева, PDF/«Новый аудит» справа
- `titleCardRow` — для формы: кнопка-иконка + заголовок в одну строку, `align-items: center`
- Строка заголовка на главной (`pageRow`): `border-bottom`, кнопка «Новый аудит» `md`

**Кнопки в шапках аудита:** `size="sm"` (28px); кнопка «← К списку» в отчёте — иконка+текст, не `iconOnly`

**Модель в DISCLAIMER:** Claude Haiku 4.5

### 2026-06-27 — Блок инструкции и иконки в отчёте аудита

**Блок «Как пользоваться» на форме `/audit/new`:**
- Вынесен отдельным блоком перед формой (не внутри `<div className={styles.form}>`)
- Сворачивается/раскрывается по клику на шапку-кнопку; шеврон анимирован (rotate 180°)
- Дефолт: `useState(() => hook.history.length === 0)` — раскрыт при первом посещении (нет истории), свёрнут при последующих
- Шапка: иконка `BookOpen` + текст через `.instrHeadLabel`, цвет `--primary`; разделитель под шапкой только когда раскрыто (`.instrHeadOpen`)
- Добавлено вводное описание инструмента (`.instrDesc`) и секция «Что анализируется»
- UC: уточнено «не влияет на финальную оценку»

**Иконки в отчёте аудита:**
- `STATUS_ICON`: символы `✓` / `!` / `✕` → `<Check>` / `<AlertTriangle>` / `<X>` из Lucide
- Списки: `·` → `<AlertCircle>` (красный) для проблем, `·` → `<ArrowRight>` (зелёный) для рекомендаций, `?` → `<HelpCircle>` (синий) для вопросов
- Убраны подложки-фоны с `.blockIcon` (было `background: rgba(0,0,0,0.1)`) и `.itemIcon` (был inline `background: ic.bg`); остался только цвет через `color`

### 2026-06-26 — PDF-экспорт во всех модулях

**Архитектура:**
- `lib/pdf/render.ts` — единое ядро: html2canvas scale:2, умные переносы страниц, срезка canvas
- `lib/pdf/branding.ts` — `pdfHeader()` (лого Husky + «SimpleOne» + дата), `pdfFooter(ai?)`, `pdfWrap()`, `sectionLabel()`
- `lib/pdf/auditPdf.ts`, `builderPdf.ts`, `checklistPdf.ts` — генераторы HTML для каждого модуля

**Переносы страниц:**
- `[data-nocut]` ставится на отдельные строки/элементы, НЕ на блок целиком — блок режется по строкам, не переносится целиком
- Если точка разреза попадает внутрь `[data-nocut]`-элемента, она сдвигается к `element.top`
- Измерение позиций через `getBoundingClientRect()` — до рендера canvas, после `await raf()` (два кадра для завершения layout)
- Каждая страница = отдельный срез canvas (`drawImage` с нужным `sy/sh`), размещается с `dstY` — не сдвиг всего изображения
- Отступ сверху: страница 1 — из `pdfWrap padding: 2rem` (~10mm), страницы 2+ — `MARGIN = 10mm`
- Номера страниц: после рендера всех страниц — цикл по `pdf.getNumberOfPages()`, `pdf.text('N / Total', PAGE_W/2, PAGE_H-4, { align: 'center' })`

**Брендинг:**
- Логотип — SVG из `Sidebar.tsx`, атрибуты переведены в HTML (`stopColor` → `stop-color`), уникальный id `htpdfg`
- Оговорка «Сгенерировано ИИ» — только в аудите (`pdfFooter(true)`), в билдере и чек-листах её нет

**Подключение:**
- `window.print()` заменён на `exportBuilderPDF()` в `StepResult.tsx` и `exportChecklistPDF()` в `ChecklistView.tsx`
- В аудите кнопка PDF уже вызывала `exportAuditPDF()` (был базовый вариант, теперь на общем рендере)

### 2026-06-27 — Тултип для кнопок, валидация формы аудита

**Тултип:**
- `Button` (`'use client'`): при наличии `title` — `onMouseEnter`/`onMouseLeave` на `<button>`, рендерит `position: fixed` span (класс `.tip` в `Button.module.css`)
- `position: fixed` не обрезается никаким `overflow: hidden` родителя
- Текст с `text-overflow: ellipsis` — нативный `title` (браузерный хинт, без кастомного компонента)

**Валидация формы аудита:**
- «Описание задачи» помечено как обязательное (красная точка `.reqDot`)
- `canRun = title.trim() && desc.trim()` — кнопка «Запустить аудит» `disabled` пока оба поля пусты

### 2026-06-27 — Чек-лист проверки макетов, ConfirmDialog, унификация кнопок

**Чек-лист «Проверка макетов» (dq):**
- `ChecklistMode` расширен значением `'dq'`; данные в `lib/data/checklists.ts`: 6 блоков, 20 критериев
- Дисклеймер `warn`: «Версия от 15.05.2025. Некоторые пункты могут не отражать текущий процесс…»
- Роут `/checklist/dq`, пункт в Sidebar (`ClipboardCheck`), метка в `checklistPdf.ts`
- `useChecklist.ts`: три точки с `?? {}` — фоллбэк для старого localStorage без ключа `dq`

**ConfirmDialog:**
- `components/ui/ConfirmDialog.tsx` — оверлей + карточка 360px, кнопки «Отмена» (secondary) + «Удалить» (danger)
- Клик по оверлею закрывает диалог
- Заменяет `window.confirm` в двух местах: список аудитов (`pendingDelete: number | null`) и отчёт (`confirmDelete: boolean`)

**Button — унификация:**
- Добавлен `variant="danger"` (красный фон, белый текст)
- Размеры переведены на фиксированную высоту: `sm` — 28px, `md` — 36px, `lg` — 44px; вертикальный padding убран
- `iconOnly` — `width` равен высоте (`28px / 36px / 44px`), `padding: 0` — всегда квадратный
- Кастомные `.listCardBtn` / `.listCardBtnDelete` удалены; кнопки аудита переведены на `Button variant="ghost" iconOnly`

### 2026-06-27 — Мобильный адаптив (брейкпоинт 768px)

- Брейкпоинт: `768px` — все `@media` в Layout, Sidebar, PageHeader, ProgressSteps
- Layout: `flex-direction: column` на мобиле — topbar встаёт сверху, контент ниже
- Sidebar: `position: fixed; left: -100%` → `left: 0` при открытии; ширина `256px` (как на десктопе)
- Sticky PageHeader: `top: 52px` на мобиле (высота topbar'а)
- Отчёт аудита: `titleCard` вынесен из `below` проп наружу — фиолетовая шапка залипает, белая карточка с названием/кнопками скроллится

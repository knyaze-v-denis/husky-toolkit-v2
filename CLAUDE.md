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

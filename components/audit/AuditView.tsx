'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, FileText, Info, ArrowRight, ScanSearch, Clock, ArrowLeft, Trash2, Download } from 'lucide-react';
import { useAudit, type AuditResult, type AuditEntry, type AuditForm } from '@/lib/hooks/useAudit';
import { PageHeader } from '@/components/builder/PageHeader';
import { Button } from '@/components/ui/Button';
import styles from './AuditView.module.css';

const DISCLAIMER = 'Анализ проводит Claude Sonnet 4.6. Модель может совершать ошибки — проверяйте выводы самостоятельно, особенно при принятии важных решений.';

// ─── MOCK DATA (dev only) ─────────────────────────────────────────

const MOCK_FORM: AuditForm = {
  title: 'Управление записями РКТ — применение к табелю',
  link: 'https://tracker.example.com/TASK-1234',
  usAs: 'сотрудник с доступом к расписанию',
  usWant: 'применять к своему табелю доступную запись РКТ и автоназначать её другим сотрудникам',
  usTo: 'гибко настраивать учёт рабочего времени без дублирования данных',
  desc: `ОС-2 Открепление чужой записи РКТ\n**Краткое описание:**\nСотрудник открепляет чужую запись РКТ, которая до текущего момента применялась для его табеля трудозатрат\n\n**Действующие лица:**\nСотрудник (далее "Пользователь")\n\n**Основной сценарий:**\n1. Пользователь переходит в раздел "Табель трудозатрат"\n2. Выбирает запись РКТ из списка доступных\n3. Применяет запись к своему табелю\n4. Система сохраняет изменения и отображает обновлённый табель`,
};

const MOCK_RESULT: AuditResult = {
  score: 72,
  summary: 'Описание задачи имеет хорошую структуру и содержит достаточно контекста для начала проектирования. User Story корректно сформулирована, основной сценарий описан. Основные замечания касаются отсутствия критериев приёмки и неполного описания граничных случаев.',
  sections: [
    {
      title: 'User Story',
      status: 'ok',
      items: [
        { status: 'ok', text: 'Роль пользователя чётко определена' },
        { status: 'ok', text: 'Ценность для пользователя сформулирована' },
        { status: 'warn', text: 'Отсутствуют критерии приёмки (Acceptance Criteria)' },
      ],
    },
    {
      title: 'Контекст и сценарии',
      status: 'warn',
      items: [
        { status: 'ok', text: 'Основной сценарий использования описан' },
        { status: 'warn', text: 'Граничные случаи и обработка ошибок не описаны' },
        { status: 'warn', text: 'Не указаны ограничения и зависимости' },
      ],
    },
    {
      title: 'Полнота для дизайна',
      status: 'ok',
      items: [
        { status: 'ok', text: 'Достаточно данных для начала проектирования' },
        { status: 'ok', text: 'Целевая аудитория понятна' },
        { status: 'fail', text: 'Отсутствует описание текущего поведения системы (as-is)' },
      ],
    },
  ],
  issues: [
    'Нет критериев приёмки — непонятно, когда задача считается выполненной',
    'Граничные случаи не описаны: что происходит при ошибке, пустых данных, отсутствии прав',
  ],
  recommendations: [
    'Добавьте раздел Acceptance Criteria с 3–5 проверяемыми условиями',
    'Опишите сценарии ошибок: недоступность сервиса, некорректные данные',
    'Укажите, как должна вести себя система в текущий момент (as-is)',
  ],
  questions: [
    'Как должна работать функция при отсутствии прав доступа у сотрудника?',
    'Есть ли ограничения на количество записей РКТ для одного табеля?',
    'Какое поведение ожидается при попытке применить уже занятую запись?',
  ],
};

// ─── SCORE HELPERS ────────────────────────────────────────────────

function scoreColors(score: number) {
  if (score >= 70) return { bg: '#E1F5EE', tc: '#085041' };
  if (score >= 40) return { bg: '#FAEEDA', tc: '#633806' };
  return { bg: '#FAECE7', tc: '#4A1B0C' };
}

const STATUS_ICON = { ok: '✓', warn: '!', fail: '✕' };

// ─── RESULT COMPONENTS ───────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const { bg, tc } = scoreColors(score);
  return (
    <div className={styles.scoreCard} style={{ background: bg }}>
      <div className={styles.scoreLabel} style={{ color: tc }}>Качество описания</div>
      <div className={styles.scoreValue} style={{ color: tc }}>{score}%</div>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill} style={{ width: `${score}%`, background: tc }} />
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: AuditResult['sections'][0] }) {
  const colorMap = {
    ok:   { bg: '#E1F5EE', tc: '#085041' },
    warn: { bg: '#FAEEDA', tc: '#633806' },
    fail: { bg: '#FAECE7', tc: '#4A1B0C' },
  };
  const c = colorMap[section.status];
  return (
    <div className={styles.block}>
      <div className={styles.blockHead} style={{ background: c.bg, color: c.tc }}>
        <span className={styles.blockIcon}>{STATUS_ICON[section.status]}</span>
        {section.title}
      </div>
      {section.items.map((item, i) => {
        const ic = colorMap[item.status];
        return (
          <div key={i} className={styles.sectionItem}>
            <span className={styles.itemIcon} style={{ background: ic.bg, color: ic.tc }}>
              {STATUS_ICON[item.status]}
            </span>
            <span className={styles.itemText}>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function ResultBody({ result }: { result: AuditResult }) {
  return (
    <>
      <ScoreBar score={result.score} />
      <div className={styles.summary}>{result.summary}</div>
      {result.sections.map(s => <SectionBlock key={s.title} section={s} />)}
      {result.issues.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockHead} style={{ background: '#FAECE7', color: '#4A1B0C' }}>Проблемы</div>
          {result.issues.map((t, i) => (
            <div key={i} className={styles.listItem}><span className={styles.bullet}>·</span>{t}</div>
          ))}
        </div>
      )}
      {result.recommendations.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockHead} style={{ background: '#E1F5EE', color: '#085041' }}>Рекомендации</div>
          {result.recommendations.map((t, i) => (
            <div key={i} className={styles.listItem}><span className={styles.bullet}>·</span>{t}</div>
          ))}
        </div>
      )}
      {result.questions.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockHead} style={{ background: '#E6F1FB', color: '#0C447C' }}>Вопросы аналитику</div>
          {result.questions.map((t, i) => (
            <div key={i} className={styles.listItem}><span className={styles.bullet}>?</span>{t}</div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── INSTRUCTION BLOCK ───────────────────────────────────────────

function InstructionBlock() {
  return (
    <div className={styles.block}>
      <div className={styles.instrHead}>Как пользоваться</div>
      <div className={styles.instrBody}>
        <div className={styles.instrItem}>
          <span className={styles.instrIcon}><FileText size={14} /></span>
          <div><strong>User Story</strong> — структура, роль, ценность, критерии принятия</div>
        </div>
        <div className={styles.instrItem}>
          <span className={styles.instrIcon}><CheckSquare size={14} /></span>
          <div><strong>Use Case</strong> — наблюдения для передачи обратной связи аналитику, не влияет на оценку</div>
        </div>
        <div className={styles.instrItem}>
          <span className={styles.instrIcon}><Info size={14} /></span>
          <div><strong>Экспертная оценка</strong> — полнота описания с точки зрения UX</div>
        </div>
      </div>
      <div className={styles.instrDivider} />
      <div className={styles.instrBody}>
        <div className={styles.instrSubhead}>По итогам аудита вы получите:</div>
        <div className={styles.instrItem}>
          <span className={styles.instrArrow}><ArrowRight size={13} /></span>
          Оценку качества описания от 0 до 100
        </div>
        <div className={styles.instrItem}>
          <span className={styles.instrArrow}><ArrowRight size={13} /></span>
          Список замечаний и рекомендаций
        </div>
        <div className={styles.instrItem}>
          <span className={styles.instrArrow}><ArrowRight size={13} /></span>
          Готовые вопросы для аналитика
        </div>
      </div>
      <div className={styles.instrFooter}>
        Заполните хотя бы одно из полей описания. Чем подробнее — тем точнее анализ.
      </div>
    </div>
  );
}

// ─── LOADING ─────────────────────────────────────────────────────

function LoadingBlock() {
  return (
    <div className={styles.loadingBlock}>
      <div className={styles.loadingIcon}><ScanSearch size={24} strokeWidth={1.5} /></div>
      <div className={styles.loadingTitle}>Claude анализирует задачу</div>
      <div className={styles.loadingMeta}><Clock size={13} />Обычно это занимает 30–60 секунд</div>
    </div>
  );
}

// ─── BACK BUTTON (fixed, left gutter) ────────────────────────────

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className={styles.backBtnWrap}>
      <Button variant="secondary" size="sm" onClick={onClick}>
        <ArrowLeft size={15} />
      </Button>
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────

export function AuditListView() {
  const hook = useAudit();
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="ИИ-аудит задачи"
        disclaimer={{ text: DISCLAIMER, variant: 'info' }}
        sticky={false}
      />
      <div className={styles.wrap}>
        {hook.history.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><ScanSearch size={32} strokeWidth={1.2} /></div>
            <div className={styles.emptyTitle}>Аудиты ещё не проводились</div>
            <div className={styles.emptyDesc}>Запустите первый аудит, чтобы оценить описание задачи</div>
            <Button variant="primary" onClick={() => router.push('/audit/new')}>Провести первый аудит</Button>
          </div>
        ) : (
          <>
            <div className={styles.pageRow}>
              <span className={styles.pageTitle}>Мои аудиты</span>
              <div className={styles.pageActions}>
                <Button variant="primary" onClick={() => router.push('/audit/new')}>Новый аудит</Button>
              </div>
            </div>
            <div className={styles.listWrap}>
              {hook.history.map(e => {
                const { bg, tc } = scoreColors(e.result.score);
                return (
                  <div key={e.id} className={styles.listCard} onClick={() => router.push(`/audit/${e.id}`)}>
                    <div className={styles.listCardScore} style={{ background: bg, color: tc }}>
                      {e.result.score}%
                    </div>
                    <div className={styles.listCardBody}>
                      <div className={styles.listCardTitle}>{e.title}</div>
                      <div className={styles.listCardMeta}>{e.date} · {e.time}</div>
                    </div>
                    <button
                      className={styles.listCardDelete}
                      onClick={ev => { ev.stopPropagation(); hook.deleteEntry(e.id); }}
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── FORM VIEW ───────────────────────────────────────────────────

export function AuditFormView() {
  const hook = useAudit();
  const router = useRouter();
  const [mockLoading, setMockLoading] = useState(false);

  const loading = hook.loading || mockLoading;

  const handleRun = async () => {
    const id = await hook.runAudit();
    if (id !== null) router.push(`/audit/${id}?fresh=1`);
  };

  const handleMock = async () => {
    hook.updateForm(MOCK_FORM);
    setMockLoading(true);
    await new Promise(r => setTimeout(r, 10000));
    setMockLoading(false);
    const id = hook.injectResult(MOCK_RESULT, MOCK_FORM);
    router.push(`/audit/${id}?fresh=1`);
  };

  return (
    <>
      <BackBtn onClick={() => router.back()} />
      <div>
        <PageHeader
          title="ИИ-аудит задачи"
          disclaimer={{ text: DISCLAIMER, variant: 'info' }}
          banner={!loading && hook.error ? { text: hook.error, variant: 'bad' } : null}
          sticky={false}
        />
        <div className={styles.wrap}>
          <div className={styles.pageRow}>
            <span className={styles.pageTitle}>Новый аудит</span>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : (
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Название задачи<span className={styles.reqDot} />
                </label>
                <input
                  className={styles.input}
                  placeholder="Например: Добавить фильтр в таблицу"
                  value={hook.form.title}
                  onChange={e => hook.updateForm({ title: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Ссылка на задачу</label>
                <input
                  className={styles.input}
                  placeholder="https://..."
                  value={hook.form.link}
                  onChange={e => hook.updateForm({ link: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>User Story</label>
                <div className={styles.usGroup}>
                  <div className={styles.usField}>
                    <span className={styles.usPrefix}>Как</span>
                    <input className={styles.usInput} placeholder="роль пользователя" value={hook.form.usAs} onChange={e => hook.updateForm({ usAs: e.target.value })} />
                  </div>
                  <div className={styles.usField}>
                    <span className={styles.usPrefix}>Я хочу</span>
                    <input className={styles.usInput} placeholder="действие или функциональность" value={hook.form.usWant} onChange={e => hook.updateForm({ usWant: e.target.value })} />
                  </div>
                  <div className={styles.usField}>
                    <span className={styles.usPrefix}>Чтобы</span>
                    <input className={styles.usInput} placeholder="ценность или цель" value={hook.form.usTo} onChange={e => hook.updateForm({ usTo: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Описание задачи</label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  placeholder="Опишите задачу: контекст, пользователи, сценарии, ограничения…"
                  value={hook.form.desc}
                  onChange={e => hook.updateForm({ desc: e.target.value })}
                />
              </div>
              <div className={styles.formActions}>
                <Button variant="primary" fullWidth onClick={handleRun}>Запустить аудит</Button>
                {process.env.NODE_ENV !== 'production' && (
                  <Button variant="secondary" size="sm" onClick={handleMock}>Загрузить пример</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── REPORT VIEW ─────────────────────────────────────────────────

export function AuditReportView({ entry, isFresh }: { entry: AuditEntry | null; isFresh: boolean }) {
  const hook = useAudit();
  const router = useRouter();

  if (!entry) {
    return (
      <div>
        <PageHeader title="ИИ-аудит задачи" disclaimer={{ text: DISCLAIMER, variant: 'info' }} sticky={false} />
        <div className={styles.wrap}>
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Аудит не найден</div>
            <Button variant="secondary" onClick={() => router.push('/audit')}>К списку</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BackBtn onClick={() => router.back()} />
      <div>
        <PageHeader title="ИИ-аудит задачи" disclaimer={{ text: DISCLAIMER, variant: 'info' }} sticky={false} />
        <div className={styles.wrap}>
          <div className={styles.pageRow}>
            <div className={styles.reportTitleCol}>
              <span className={styles.pageTitle}>{entry.title}</span>
              {entry.link && (
                <a href={entry.link} target="_blank" rel="noreferrer" className={styles.reportLink}>
                  {entry.link}
                </a>
              )}
            </div>
            <div className={styles.pageActions}>
              <Button variant="secondary" onClick={() => window.print()}>
                <Download size={13} />PDF
              </Button>
              {isFresh && (
                <Button variant="secondary" onClick={() => { hook.resetAudit(); router.push('/audit/new'); }}>
                  Новый аудит
                </Button>
              )}
            </div>
          </div>
          <ResultBody result={entry.result} />
        </div>
      </div>
    </>
  );
}

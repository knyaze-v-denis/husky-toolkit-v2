'use client';

import { useState } from 'react';
import { CheckSquare, FileText, Info, ArrowRight, ScanSearch, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { useAudit, type AuditResult, type AuditEntry } from '@/lib/hooks/useAudit';
import { PageHeader } from '@/components/builder/PageHeader';
import { Button } from '@/components/ui/Button';
import styles from './AuditView.module.css';

const DISCLAIMER = 'Анализ проводит Claude Sonnet 4.6. Модель может совершать ошибки — проверяйте выводы самостоятельно, особенно при принятии важных решений.';

type View = 'list' | 'form' | 'report';

// ─── MOCK DATA (dev only) ─────────────────────────────────────────

const MOCK_FORM = {
  title: 'Управление записями РКТ — применение к табелю',
  link: '',
  usAs: 'сотрудник с доступом к расписанию',
  usWant: 'применять к своему табелю доступную запись РКТ и автоназначать её другим сотрудникам',
  usTo: 'гибко настраивать учёт рабочего времени без дублирования данных',
  desc: `ОС-2 Открепление чужой записи РКТ\n**Краткое описание:**\nСотрудник открепляет чужую запись РКТ, которая до текущего момента применялась для его табеля трудозатрат\n\n**Действующие лица:**\nСотрудник (далее "Пользователь")\n\n**Основной сценарий:**\n1. Пользователь переходит в раздел "Табель трудозатрат"\n2. Выбирает запись РКТ из списка доступных\n3. Применяет запись к своему табелю\n4. Система сохраняет изменения и отображает обновлённый табель`,
};

const MOCK_RESULT: import('@/lib/hooks/useAudit').AuditResult = {
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

// ─── LIST VIEW ────────────────────────────────────────────────────

function ListView({
  history,
  onOpen,
  onDelete,
  onNew,
}: {
  history: AuditEntry[];
  onOpen: (e: AuditEntry) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <PageHeader
        title="ИИ-аудит задачи"
        badge={history.length > 0 ? `${history.length}` : undefined}
        disclaimer={{ text: DISCLAIMER, variant: 'info' }}
        headerRight={<button className={styles.hdrBtn} onClick={onNew}>+ Новый аудит</button>}
      />
      <div className={styles.wrap}>
        {history.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><ScanSearch size={32} strokeWidth={1.2} /></div>
            <div className={styles.emptyTitle}>Аудиты ещё не проводились</div>
            <div className={styles.emptyDesc}>Запустите первый аудит, чтобы оценить описание задачи</div>
            <Button variant="primary" onClick={onNew}>Провести первый аудит</Button>
          </div>
        ) : (
          <div className={styles.listWrap}>
            {history.map(e => {
              const { bg, tc } = scoreColors(e.result.score);
              return (
                <div key={e.id} className={styles.listCard} onClick={() => onOpen(e)}>
                  <div className={styles.listCardScore} style={{ background: bg, color: tc }}>
                    {e.result.score}%
                  </div>
                  <div className={styles.listCardBody}>
                    <div className={styles.listCardTitle}>{e.title}</div>
                    <div className={styles.listCardMeta}>{e.date} · {e.time}</div>
                  </div>
                  <button
                    className={styles.listCardDelete}
                    onClick={ev => { ev.stopPropagation(); onDelete(e.id); }}
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FORM VIEW ───────────────────────────────────────────────────

function FormView({
  form,
  updateForm,
  loading,
  error,
  onRun,
  onBack,
  onMock,
}: {
  form: ReturnType<typeof useAudit>['form'];
  updateForm: ReturnType<typeof useAudit>['updateForm'];
  loading: boolean;
  error: string | null;
  onRun: () => void;
  onBack: () => void;
  onMock?: () => void;
}) {
  const banner = error ? { text: error, variant: 'bad' as const } : null;

  if (loading) {
    return (
      <>
        <button className={styles.backBtn} onClick={onBack} title="К списку аудитов">
          <ArrowLeft size={18} />
        </button>
        <div>
          <PageHeader title="Новый аудит" disclaimer={{ text: DISCLAIMER, variant: 'info' }} />
          <div className={styles.wrap}>
            <LoadingBlock />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <button className={styles.backBtn} onClick={onBack} title="К списку аудитов">
        <ArrowLeft size={18} />
      </button>
      <div>
        <PageHeader
          title="Новый аудит"
          disclaimer={{ text: DISCLAIMER, variant: 'info' }}
          banner={banner}
        />
        <div className={styles.wrap}>
          <InstructionBlock />

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>
                Название задачи<span className={styles.reqDot} />
              </label>
              <input
                className={styles.input}
                placeholder="Например: Добавить фильтр в таблицу"
                value={form.title}
                disabled={loading}
                onChange={e => updateForm({ title: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Ссылка на задачу</label>
              <input
                className={styles.input}
                placeholder="https://..."
                value={form.link}
                disabled={loading}
                onChange={e => updateForm({ link: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>User Story</label>
              <div className={styles.usGroup}>
                <div className={styles.usField}>
                  <span className={styles.usPrefix}>Как</span>
                  <input className={styles.usInput} placeholder="роль пользователя" value={form.usAs} disabled={loading} onChange={e => updateForm({ usAs: e.target.value })} />
                </div>
                <div className={styles.usField}>
                  <span className={styles.usPrefix}>Я хочу</span>
                  <input className={styles.usInput} placeholder="действие или функциональность" value={form.usWant} disabled={loading} onChange={e => updateForm({ usWant: e.target.value })} />
                </div>
                <div className={styles.usField}>
                  <span className={styles.usPrefix}>Чтобы</span>
                  <input className={styles.usInput} placeholder="ценность или цель" value={form.usTo} disabled={loading} onChange={e => updateForm({ usTo: e.target.value })} />
                </div>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Описание задачи</label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="Опишите задачу: контекст, пользователи, сценарии, ограничения…"
                value={form.desc}
                disabled={loading}
                onChange={e => updateForm({ desc: e.target.value })}
              />
            </div>
            <div className={styles.formActions}>
              <Button variant="primary" fullWidth onClick={onRun} disabled={loading}>
                {loading ? 'Анализируем…' : 'Запустить аудит'}
              </Button>
              {process.env.NODE_ENV !== 'production' && onMock && (
                <Button variant="secondary" size="sm" onClick={onMock} disabled={loading}>
                  Загрузить пример
                </Button>
              )}
            </div>
          </div>

          {loading && <LoadingBlock />}
        </div>
      </div>
    </>
  );
}

// ─── REPORT VIEW ─────────────────────────────────────────────────

function ReportView({
  form,
  result,
  isFresh,
  onNewAudit,
  onBackToList,
}: {
  form: ReturnType<typeof useAudit>['form'];
  result: AuditResult;
  isFresh: boolean;
  onNewAudit: () => void;
  onBackToList: () => void;
}) {
  return (
    <>
      <button className={styles.backBtn} onClick={onBackToList} title="К списку аудитов">
        <ArrowLeft size={18} />
      </button>
      <div>
        <PageHeader
          title={form.title || 'Результат аудита'}
          disclaimer={{ text: DISCLAIMER, variant: 'info' }}
          progress={result.score}
        />
        <div className={styles.wrap}>
          <ResultBody result={result} />
          <div className={styles.reportActions}>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              Экспорт PDF
            </Button>
            {isFresh && (
              <Button variant="primary" size="sm" onClick={onNewAudit}>Новый аудит</Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────

export function AuditView() {
  const hook = useAudit();
  const [view, setView] = useState<View>('list');
  const [isFresh, setIsFresh] = useState(false);
  const [mockLoading, setMockLoading] = useState(false);

  const handleOpen = (entry: AuditEntry) => {
    hook.openEntry(entry);
    setView('report');
    setIsFresh(false);
  };

  const handleNew = () => {
    hook.resetAudit();
    setView('form');
    setIsFresh(false);
  };

  const handleRun = async () => {
    const ok = await hook.runAudit();
    if (ok) {
      setView('report');
      setIsFresh(true);
    }
  };

  const handleMock = async () => {
    hook.updateForm(MOCK_FORM);
    setMockLoading(true);
    await new Promise(r => setTimeout(r, 10000));
    setMockLoading(false);
    hook.injectResult(MOCK_RESULT);
    setView('report');
    setIsFresh(true);
  };

  const handleNewAudit = () => {
    hook.resetAudit();
    setView('form');
    setIsFresh(false);
  };

  const handleBackToList = () => {
    hook.resetAudit();
    setView('list');
    setIsFresh(false);
  };

  if (view === 'list') {
    return (
      <ListView
        history={hook.history}
        onOpen={handleOpen}
        onDelete={hook.deleteEntry}
        onNew={handleNew}
      />
    );
  }

  if (view === 'form') {
    return (
      <FormView
        form={hook.form}
        updateForm={hook.updateForm}
        loading={hook.loading || mockLoading}
        error={hook.error}
        onRun={handleRun}
        onBack={handleBackToList}
        onMock={handleMock}
      />
    );
  }

  return (
    <ReportView
      form={hook.form}
      result={hook.result!}
      isFresh={isFresh}
      onNewAudit={handleNewAudit}
      onBackToList={handleBackToList}
    />
  );
}

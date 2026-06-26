'use client';

import { useState } from 'react';
import { CheckSquare, FileText, Info, ArrowRight, ScanSearch, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { useAudit, type AuditResult, type AuditEntry } from '@/lib/hooks/useAudit';
import { PageHeader } from '@/components/builder/PageHeader';
import { Button } from '@/components/ui/Button';
import styles from './AuditView.module.css';

const DISCLAIMER = 'Анализ проводит Claude Sonnet 4.6. Модель может совершать ошибки — проверяйте выводы самостоятельно, особенно при принятии важных решений.';

type View = 'list' | 'form' | 'report';

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
}: {
  form: ReturnType<typeof useAudit>['form'];
  updateForm: ReturnType<typeof useAudit>['updateForm'];
  loading: boolean;
  error: string | null;
  onRun: () => void;
  onBack: () => void;
}) {
  const banner = error ? { text: error, variant: 'bad' as const } : null;

  return (
    <div>
      <PageHeader
        title="Новый аудит"
        disclaimer={{ text: DISCLAIMER, variant: 'info' }}
        banner={banner}
        statsRight={
          <Button variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft size={13} />К списку
          </Button>
        }
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
              onChange={e => updateForm({ title: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Ссылка на задачу</label>
            <input
              className={styles.input}
              placeholder="https://..."
              value={form.link}
              onChange={e => updateForm({ link: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>User Story</label>
            <div className={styles.usGroup}>
              <div className={styles.usRow}>
                <span className={styles.usPrefix}>Как</span>
                <input className={styles.input} placeholder="роль пользователя" value={form.usAs} onChange={e => updateForm({ usAs: e.target.value })} />
              </div>
              <div className={styles.usRow}>
                <span className={styles.usPrefix}>Я хочу</span>
                <input className={styles.input} placeholder="действие или функциональность" value={form.usWant} onChange={e => updateForm({ usWant: e.target.value })} />
              </div>
              <div className={styles.usRow}>
                <span className={styles.usPrefix}>Чтобы</span>
                <input className={styles.input} placeholder="ценность или цель" value={form.usTo} onChange={e => updateForm({ usTo: e.target.value })} />
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
              onChange={e => updateForm({ desc: e.target.value })}
            />
          </div>
          <Button variant="primary" onClick={onRun} disabled={loading}>
            {loading ? 'Анализируем…' : 'Запустить аудит'}
          </Button>
        </div>

        {loading && <LoadingBlock />}
      </div>
    </div>
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
  const banner = {
    text: `Аудит завершён · ${result.score}%`,
    variant: result.score >= 70 ? 'ok' as const : result.score >= 40 ? 'warn' as const : 'bad' as const,
  };

  return (
    <div>
      <PageHeader
        title={form.title || 'Результат аудита'}
        disclaimer={{ text: DISCLAIMER, variant: 'info' }}
        banner={banner}
        progress={result.score}
        statsLeft={`${result.sections.length} разделов проверено`}
        statsRight={
          <>
            {isFresh && (
              <Button variant="secondary" size="sm" onClick={onNewAudit}>Новый аудит</Button>
            )}
            <Button variant="secondary" size="sm" onClick={onBackToList}>
              <ArrowLeft size={13} />К списку
            </Button>
          </>
        }
      />
      <div className={styles.wrap}>
        <ResultBody result={result} />
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────

export function AuditView() {
  const hook = useAudit();
  const [view, setView] = useState<View>('list');
  const [isFresh, setIsFresh] = useState(false);

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
        loading={hook.loading}
        error={hook.error}
        onRun={handleRun}
        onBack={handleBackToList}
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

'use client';

import { useAudit, type AuditResult, type AuditEntry } from '@/lib/hooks/useAudit';
import { PageHeader } from '@/components/builder/PageHeader';
import { Button } from '@/components/ui/Button';
import styles from './AuditView.module.css';

const STATUS_ICON = {
  ok:   '✓',
  warn: '!',
  fail: '✕',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#085041' : score >= 40 ? '#633806' : '#4A1B0C';
  const bg    = score >= 70 ? '#E1F5EE' : score >= 40 ? '#FAEEDA' : '#FAECE7';
  return (
    <div className={styles.scoreCard} style={{ background: bg }}>
      <div className={styles.scoreLabel} style={{ color }}>Качество описания</div>
      <div className={styles.scoreValue} style={{ color }}>{score}%</div>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill} style={{ width: `${score}%`, background: color }} />
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

function ResultView({ result }: { result: AuditResult }) {
  return (
    <div className={styles.resultWrap}>
      <ScoreBar score={result.score} />

      <div className={styles.summary}>{result.summary}</div>

      {result.sections.map(s => <SectionBlock key={s.title} section={s} />)}

      {result.issues.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockHead} style={{ background: '#FAECE7', color: '#4A1B0C' }}>
            Проблемы
          </div>
          {result.issues.map((t, i) => (
            <div key={i} className={styles.listItem}>
              <span className={styles.bullet}>·</span>{t}
            </div>
          ))}
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockHead} style={{ background: '#E1F5EE', color: '#085041' }}>
            Рекомендации
          </div>
          {result.recommendations.map((t, i) => (
            <div key={i} className={styles.listItem}>
              <span className={styles.bullet}>·</span>{t}
            </div>
          ))}
        </div>
      )}

      {result.questions.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockHead} style={{ background: '#E6F1FB', color: '#0C447C' }}>
            Вопросы аналитику
          </div>
          {result.questions.map((t, i) => (
            <div key={i} className={styles.listItem}>
              <span className={styles.bullet}>?</span>{t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({
  history,
  onOpen,
  onDelete,
}: {
  history: AuditEntry[];
  onOpen: (e: AuditEntry) => void;
  onDelete: (id: number) => void;
}) {
  if (history.length === 0) return null;
  return (
    <div className={styles.block}>
      <div className={styles.blockHead} style={{ background: '#f5f5f5', color: '#444' }}>
        История аудитов ({history.length})
      </div>
      {history.map(e => (
        <div key={e.id} className={styles.historyItem}>
          <button className={styles.historyBtn} onClick={() => onOpen(e)}>
            <div className={styles.historyTitle}>{e.title}</div>
            <div className={styles.historyMeta}>{e.date} · {e.time} · {e.result.score}%</div>
          </button>
          <button className={styles.deleteBtn} onClick={() => onDelete(e.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

export function AuditView() {
  const {
    form, updateForm,
    result, loading, error,
    history,
    runAudit, openEntry, deleteEntry, resetAudit,
  } = useAudit();

  const banner = error
    ? { text: error, variant: 'bad' as const }
    : result
    ? { text: `Аудит завершён · ${result.score}%`, variant: result.score >= 70 ? 'ok' as const : result.score >= 40 ? 'warn' as const : 'bad' as const }
    : null;

  const statsLeft = loading
    ? 'Анализируем описание задачи…'
    : result
    ? `${result.sections.length} разделов проверено`
    : 'Вставьте описание задачи и запустите аудит';

  return (
    <div>
      <PageHeader
        title="ИИ-аудит задачи"
        badge={result ? `${result.score}%` : 'Новый аудит'}
        banner={banner}
        progress={result ? result.score : 0}
        statsLeft={statsLeft}
        statsRight={
          result ? (
            <Button variant="secondary" size="sm" onClick={resetAudit}>Новый аудит</Button>
          ) : undefined
        }
      />

      <div className={styles.wrap}>
        {/* Форма */}
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Название задачи *</label>
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
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Как [роль] я хочу [действие], чтобы [ценность]"
              value={form.us}
              onChange={e => updateForm({ us: e.target.value })}
            />
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
          <Button variant="primary" onClick={runAudit} disabled={loading}>
            {loading ? 'Анализируем…' : 'Запустить аудит'}
          </Button>
        </div>

        {/* Результат */}
        {result && <ResultView result={result} />}

        {/* История */}
        <HistoryPanel history={history} onOpen={openEntry} onDelete={deleteEntry} />
      </div>
    </div>
  );
}

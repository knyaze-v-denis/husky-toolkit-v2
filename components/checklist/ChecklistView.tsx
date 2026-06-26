'use client';

import { CHECKLISTS, type ChecklistMode } from '@/lib/data/checklists';
import { useChecklist } from '@/lib/hooks/useChecklist';
import { PageHeader } from '@/components/builder/PageHeader';
import { Button } from '@/components/ui/Button';
import { hexToRgba } from '@/lib/utils';
import styles from './ChecklistView.module.css';

interface ChecklistViewProps {
  mode: ChecklistMode;
}

const INFO: Record<ChecklistMode, string> = {
  us: 'Проверьте User Story по критериям перед тем, как передать задачу в работу.',
  uc: 'Проверьте Use Case перед передачей документа аналитику или на ревью.',
  ex: 'Экспертная оценка описания задачи — перед стартом проектирования.',
};

export function ChecklistView({ mode }: ChecklistViewProps) {
  const { checks, toggle, reset, stats } = useChecklist();
  const cl = CHECKLISTS[mode];
  const st = stats(mode);
  const cur = checks[mode];

  const banner = st.pct === 100
    ? { text: 'Все критерии выполнены.', variant: 'ok' as const }
    : st.missedReq > 0
    ? { text: `Не выполнено обязательных: ${st.missedReq}`, variant: 'warn' as const }
    : null;

  return (
    <div>
      <PageHeader
        title={cl.label}
        badge={`${st.checked} / ${st.total}`}
        banner={banner}
        progress={st.pct}
        statsLeft={`${st.pct}% · ${st.checked} из ${st.total} отмечено`}
        statsRight={
          <Button variant="secondary" size="sm" onClick={() => reset(mode)}>Сбросить</Button>
        }
      />

      <div className={styles.info}>{INFO[mode]}</div>

      <div>
        {cl.blocks.map(block => (
          <div
            key={block.title}
            className={styles.block}
            style={{ '--active-bg': hexToRgba(block.color, 0.3), '--active-color': block.tc } as React.CSSProperties}
          >
            <div
              className={styles.blockHead}
              style={{ background: block.color, color: block.tc }}
            >
              {block.title}
            </div>
            {block.items.map((item, i) => {
              const key = `${block.title}|${i}`;
              const checked = !!cur[key];
              return (
                <div
                  key={key}
                  className={`${styles.item} ${checked ? styles.checked : ''}`}
                  onClick={() => toggle(mode, key)}
                >
                  <div className={`${styles.check} ${checked ? styles.checkOn : ''}`}>
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemText}>
                      {item.r && <span className={styles.req}>★</span>}
                      {item.t}
                    </div>
                    <div className={styles.itemHint}>{item.h}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div className={styles.footnote}>★ — обязательный критерий</div>
      </div>
    </div>
  );
}

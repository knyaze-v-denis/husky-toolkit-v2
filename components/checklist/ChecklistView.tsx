'use client';

import { Download } from 'lucide-react';
import { CHECKLISTS, type ChecklistMode } from '@/lib/data/checklists';
import { exportChecklistPDF } from '@/lib/pdf/checklistPdf';
import { useChecklist } from '@/lib/hooks/useChecklist';
import { PageHeader } from '@/components/builder/PageHeader';
import { Button } from '@/components/ui/Button';
import { hexToRgba } from '@/lib/utils';
import styles from './ChecklistView.module.css';

interface ChecklistViewProps {
  mode: ChecklistMode;
}

const DRAFT_DISCLAIMER = 'Регламентирующий документ по этому чек-листу находится в процессе разработки и утверждения. Используйте чек-лист как ориентир, а не как строгое требование.';
const UC_DISCLAIMER = 'Дизайнеры не проводят ревью Use Case\'ов в рамках текущего процесса. Этот чек-лист можно использовать как опору, если вы самостоятельно пишете UC, или чтобы сформулировать обратную связь руководителю отдела бизнес- и системного анализа.';

const CONFIG: Record<ChecklistMode, { disclaimer: string; disclaimerVariant: 'info' | 'warn'; hasRequired: boolean; fullBanner: boolean }> = {
  us: { disclaimer: DRAFT_DISCLAIMER, disclaimerVariant: 'warn', hasRequired: false, fullBanner: false },
  uc: { disclaimer: UC_DISCLAIMER,    disclaimerVariant: 'info', hasRequired: true,  fullBanner: true  },
  ex: { disclaimer: DRAFT_DISCLAIMER, disclaimerVariant: 'warn', hasRequired: false, fullBanner: false },
};

export function ChecklistView({ mode }: ChecklistViewProps) {
  const { checks, toggle, reset, stats } = useChecklist();
  const cl = CHECKLISTS[mode];
  const st = stats(mode);
  const cur = checks[mode];
  const cfg = CONFIG[mode];

  const banner = (() => {
    if (cfg.fullBanner) {
      if (st.missedReq > 0) return { text: `Требуется доработка · не выполнено обязательных: ${st.missedReq}`, variant: 'warn' as const };
      if (st.pct < 100)     return { text: 'Обязательные критерии выполнены', variant: 'info' as const };
      return { text: 'Все критерии выполнены', variant: 'ok' as const };
    }
    return st.pct === 100 ? { text: 'Все критерии выполнены', variant: 'ok' as const } : null;
  })();

  return (
    <div>
      <PageHeader
        title={cl.label}
        disclaimer={{ text: cfg.disclaimer, variant: cfg.disclaimerVariant }}
        banner={banner}
        progress={st.pct}
        statsLeft={`${st.checked} из ${st.total} критериев`}
        statsRight={
          <>
            <Button variant="secondary" size="sm" onClick={() => exportChecklistPDF(mode, cur)}>
              <Download size={12} />PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => reset(mode)}>Сбросить</Button>
          </>
        }
      />

      <div className={styles.list}>
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
                      {item.t}
                      {item.r && <span className={styles.reqDot} />}
                    </div>
                    <div className={styles.itemHint}>{item.h}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

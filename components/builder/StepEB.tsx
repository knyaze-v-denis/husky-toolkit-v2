'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EB_COMPLEXITY, EB_NOVELTY, RISK_GROUPS, BUILDS, type BuildType } from '@/lib/data/builder';
import { Button } from '@/components/ui/Button';
import { hexToRgba } from '@/lib/utils';
import styles from './StepEB.module.css';

interface StepEBProps {
  build: BuildType;
  complexity: string | null;
  novelty: string | null;
  risks: Record<string, string[]>;
  onFactor: (key: 'complexity' | 'novelty', value: string) => void;
  onRisk: (group: string, v: string, isNone: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}


export function StepEB({
  build, complexity, novelty, risks,
  onFactor, onRisk, onNext, onBack,
}: StepEBProps) {
  const b = BUILDS[build];
  const canNext = complexity != null && novelty != null;

  return (
    <div className={styles.wrap}>

      {/* Объём работ */}
      <div className={styles.block} style={{ '--active-bg': hexToRgba(b.color, 0.2), '--active-color': b.tc } as React.CSSProperties}>
        <div className={styles.blockHead} style={{ background: b.color, color: b.tc }}>
          <span>Объём работ</span>
          <span className={styles.blockHint}>Определено автоматически</span>
        </div>
        <div className={`${styles.optRow} ${styles.optActive}`}>
          <div className={`${styles.radio} ${styles.radioActive}`} />
          <div className={styles.optText}>
            <div className={styles.optLabel}>{b.name} билд</div>
            <div className={styles.optSub}>{b.desc}</div>
          </div>
          <div className={styles.optPoints}>+{b.ebVol}</div>
        </div>
      </div>

      {/* Сложность */}
      <div className={styles.block} style={{ '--active-bg': hexToRgba(EB_COMPLEXITY.color, 0.3), '--active-color': EB_COMPLEXITY.tc } as React.CSSProperties}>
        <div
          className={styles.blockHead}
          style={{ background: EB_COMPLEXITY.color, color: EB_COMPLEXITY.tc }}
        >
          <span>{EB_COMPLEXITY.label}</span>
          <span className={styles.blockHint}>{EB_COMPLEXITY.hint}</span>
        </div>
        {EB_COMPLEXITY.opts.map(opt => {
          const active = complexity === opt.v;
          return (
            <div
              key={opt.v}
              className={`${styles.optRow} ${active ? styles.optActive : ''}`}
              onClick={() => onFactor('complexity', opt.v)}
            >
              <div className={`${styles.radio} ${active ? styles.radioActive : ''}`} />
              <div className={styles.optText}>
                <div className={styles.optLabel}>{opt.l}</div>
                <div className={styles.optSub}>{opt.sub}</div>
              </div>
              {opt.p > 0 && <div className={styles.optPoints}>+{opt.p}</div>}
            </div>
          );
        })}
      </div>

      {/* Новизна */}
      <div className={styles.block} style={{ '--active-bg': hexToRgba(EB_NOVELTY.color, 0.3), '--active-color': EB_NOVELTY.tc } as React.CSSProperties}>
        <div
          className={styles.blockHead}
          style={{ background: EB_NOVELTY.color, color: EB_NOVELTY.tc }}
        >
          <span>{EB_NOVELTY.label}</span>
          <span className={styles.blockHint}>{EB_NOVELTY.hint}</span>
        </div>
        {EB_NOVELTY.opts.map(opt => {
          const active = novelty === opt.v;
          return (
            <div
              key={opt.v}
              className={`${styles.optRow} ${active ? styles.optActive : ''}`}
              onClick={() => onFactor('novelty', opt.v)}
            >
              <div className={`${styles.radio} ${active ? styles.radioActive : ''}`} />
              <div className={styles.optText}>
                <div className={styles.optLabel}>{opt.l}</div>
                <div className={styles.optSub}>{opt.sub}</div>
              </div>
              {opt.p > 0 && <div className={styles.optPoints}>+{opt.p}</div>}
            </div>
          );
        })}
      </div>

      {/* Риски */}
      <div className={styles.block} style={{ '--active-bg': hexToRgba('#FAEEDA', 0.3), '--active-color': '#633806' } as React.CSSProperties}>
        <div className={styles.blockHead} style={{ background: '#FAEEDA', color: '#633806' }}>
          <span>Риски</span>
        </div>
        {RISK_GROUPS.map((group) => {
          const sel = risks[group.label] ?? [];
          return (
            <div key={group.label}>
              <div className={styles.groupLabel}>{group.label}</div>
              {group.items.map(item => {
                const active = sel.includes(item.v);
                return (
                  <div
                    key={item.v}
                    className={`${styles.optRow} ${active ? styles.optActive : ''}`}
                    onClick={() => onRisk(group.label, item.v, group.radio ? true : item.none)}
                  >
                    {group.radio ? (
                      <div className={`${styles.radio} ${active ? styles.radioActive : ''}`} />
                    ) : (
                      <div className={`${styles.checkbox} ${active ? styles.checkboxActive : ''}`}>
                        {active && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    )}
                    <div className={styles.optText}>
                      <div className={styles.optLabel}>{item.l}</div>
                      {item.sub && <div className={styles.optSub}>{item.sub}</div>}
                    </div>
                    {item.p > 0 && <div className={styles.optPoints}>+{item.p}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={15} />Назад</Button>
        <Button variant="primary" onClick={onNext} disabled={!canNext}>Итог<ArrowRight size={15} /></Button>
      </div>
    </div>
  );
}

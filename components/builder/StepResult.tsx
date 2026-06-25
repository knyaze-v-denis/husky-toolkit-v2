'use client';

import { BUILDS, EB_COMPLEXITY, EB_NOVELTY, RISK_GROUPS, fmtScore, type BuildType } from '@/lib/data/builder';
import styles from './StepResult.module.css';

interface StepResultProps {
  build: BuildType;
  qScore: number;
  ebScore: number;
  complexity: string | null;
  novelty: string | null;
  risks: Record<string, string[]>;
  ebSize: { size: string; time: string; range: string };
  onBack: () => void;
  onReset: () => void;
}

export function StepResult({
  build, qScore, ebScore, complexity, novelty, risks,
  ebSize, onBack, onReset,
}: StepResultProps) {
  const b = BUILDS[build];

  const cpLabel = EB_COMPLEXITY.opts.find(o => o.v === complexity)?.l ?? '—';
  const nvLabel = EB_NOVELTY.opts.find(o => o.v === novelty)?.l ?? '—';

  const sizeColors: Record<string, { bg: string; tc: string }> = {
    SM: { bg: '#E1F5EE', tc: '#085041' },
    MD: { bg: '#FAEEDA', tc: '#633806' },
    LG: { bg: '#FAECE7', tc: '#4A1B0C' },
  };
  const sc = sizeColors[ebSize.size] ?? sizeColors.SM;

  return (
    <div className={styles.wrap}>

      {/* Билд */}
      <div className={styles.buildCard} style={{ background: b.color }}>
        <div className={styles.buildLabel} style={{ color: b.tc }}>Билд проектирования</div>
        <div className={styles.buildName} style={{ color: b.tc }}>{b.name}</div>
        <div className={styles.buildRange} style={{ color: b.tc }}>
          Опросник: {fmtScore(qScore)} баллов · Диапазон: {b.range}
        </div>
      </div>

      {/* Размер ЭБ */}
      <div className={styles.ebCard} style={{ background: sc.bg }}>
        <div className={styles.ebLeft}>
          <div className={styles.ebLabel} style={{ color: sc.tc }}>Размер ЭБ</div>
          <div className={styles.ebTime} style={{ color: sc.tc }}>{ebSize.time}</div>
          <div className={styles.ebRange} style={{ color: sc.tc }}>{ebSize.range}</div>
        </div>
        <div className={styles.ebSize} style={{ color: sc.tc }}>{ebSize.size}</div>
      </div>

      {/* Баллы ЭБ */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Расчёт объёма ЭБ</div>
        <div className={styles.row}>
          <span>Базовый объём билда</span>
          <span className={styles.pts}>{b.ebVol}</span>
        </div>
        <div className={styles.row}>
          <span>Сложность: {cpLabel}</span>
          <span className={styles.pts}>
            {EB_COMPLEXITY.opts.find(o => o.v === complexity)?.p != null
              ? `+${EB_COMPLEXITY.opts.find(o => o.v === complexity)!.p}`
              : '—'}
          </span>
        </div>
        <div className={styles.row}>
          <span>Новизна: {nvLabel}</span>
          <span className={styles.pts}>
            {EB_NOVELTY.opts.find(o => o.v === novelty)?.p != null
              ? `+${EB_NOVELTY.opts.find(o => o.v === novelty)!.p}`
              : '—'}
          </span>
        </div>

        {RISK_GROUPS.map(g => {
          const sel = (risks[g.label] ?? []).filter(v => {
            const item = g.items.find(i => i.v === v);
            return item && !item.none;
          });
          return sel.map(v => {
            const item = g.items.find(i => i.v === v)!;
            return (
              <div key={v} className={styles.row}>
                <span>Риск: {item.l}</span>
                <span className={styles.pts}>+{item.p}</span>
              </div>
            );
          });
        })}

        <div className={`${styles.row} ${styles.total}`}>
          <span>Итого</span>
          <span className={styles.pts}>{fmtScore(ebScore)} ЭБ</span>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>← Назад</button>
        <button className={styles.resetBtn} onClick={onReset}>Новая оценка</button>
      </div>
    </div>
  );
}

'use client';

import { ArrowLeft, Download } from 'lucide-react';
import { BUILDS, EB_COMPLEXITY, EB_NOVELTY, RISK_GROUPS, fmtScore, type BuildType, type ArtStatus } from '@/lib/data/builder';
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

const STATUS_LABEL: Record<ArtStatus, string> = {
  req: 'Обязательно',
  opt: 'Опционально',
  no:  'Не нужно',
};

const STATUS_CLASS: Record<ArtStatus, string> = {
  req: 'req',
  opt: 'opt',
  no:  'no',
};

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

  const reqArts = b.arts.filter(a => a.s === 'req');
  const optArts = b.arts.filter(a => a.s !== 'req');

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

      {/* Размер ЭБ — выровнен по левому краю */}
      <div className={styles.ebCard} style={{ background: sc.bg }}>
        <div className={styles.ebLabel} style={{ color: sc.tc }}>Размер ЭБ</div>
        <div className={styles.ebSize} style={{ color: sc.tc }}>{ebSize.size}</div>
        <div className={styles.ebTime} style={{ color: sc.tc }}>{ebSize.time}</div>
        <div className={styles.ebRange} style={{ color: sc.tc }}>{ebSize.range}</div>
      </div>

      {/* Расчёт баллов */}
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
          <span className={styles.pts}>{fmtScore(ebScore)} баллов</span>
        </div>
      </div>

      {/* Артефакты */}
      {reqArts.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Обязательные артефакты</div>
          <div>
            {reqArts.map((art, i) => (
              <div key={i} className={styles.artRow}>
                <span className={styles.artName}>{art.n}</span>
                <span className={`${styles.artStatus} ${styles[STATUS_CLASS[art.s]]}`}>
                  {STATUS_LABEL[art.s]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {optArts.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Дополнительные артефакты</div>
          <div>
            {optArts.map((art, i) => (
              <div key={i} className={`${styles.artRow} ${art.s === 'no' ? styles.artMuted : ''}`}>
                <span className={styles.artName}>{art.n}</span>
                <span className={`${styles.artStatus} ${styles[STATUS_CLASS[art.s]]}`}>
                  {STATUS_LABEL[art.s]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={15} style={{ marginRight: 4 }} />Назад</button>
        <div className={styles.footerRight}>
          <button className={styles.pdfBtn} onClick={() => window.print()}>
            <Download size={14} style={{ marginRight: 4 }} />PDF
          </button>
          <button className={styles.resetBtn} onClick={onReset}>Новая оценка</button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BUILDS, type BuildType, type ArtStatus } from '@/lib/data/builder';
import styles from './StepArtifacts.module.css';

interface StepArtifactsProps {
  build: BuildType;
  onNext: () => void;
  onBack: () => void;
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

export function StepArtifacts({ build, onNext, onBack }: StepArtifactsProps) {
  const b = BUILDS[build];
  const reqArts = b.arts.filter(a => a.s === 'req');
  const optArts = b.arts.filter(a => a.s !== 'req');

  return (
    <div className={styles.wrap}>
      {/* Карточка билда */}
      <div className={styles.buildCard} style={{ background: b.color }}>
        <div className={styles.buildMeta}>
          <span className={styles.buildType} style={{ color: b.tc }}>{b.type}</span>
        </div>
        <div className={styles.buildName} style={{ color: b.tc }}>{b.name} билд</div>
        <div className={styles.buildDesc} style={{ color: b.tc }}>{b.desc}</div>
      </div>

      {/* Обязательные артефакты */}
      {reqArts.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Обязательные артефакты</div>
          <div className={styles.artList}>
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

      {/* Опциональные и не нужные артефакты */}
      {optArts.length > 0 && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Дополнительные артефакты</div>
          <div className={styles.artList}>
            {optArts.map((art, i) => (
              <div key={i} className={`${styles.artRow} ${art.s === 'no' ? styles.muted : ''}`}>
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
        <button className={styles.nextBtn} onClick={onNext}>Оценить ЭБ<ArrowRight size={15} style={{ marginLeft: 4 }} /></button>
      </div>
    </div>
  );
}

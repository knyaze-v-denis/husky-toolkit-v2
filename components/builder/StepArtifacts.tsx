'use client';

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

  return (
    <div className={styles.wrap}>
      {/* Карточка билда */}
      <div className={styles.buildCard} style={{ background: b.color }}>
        <div className={styles.buildMeta}>
          <span className={styles.buildType} style={{ color: b.tc }}>{b.type}</span>
          <span className={styles.buildBadge} style={{ color: b.tc }}>
            Базовый объём: {b.ebVol > 0 ? `${b.ebVol} ЭБ` : 'без ЭБ'}
          </span>
        </div>
        <div className={styles.buildName} style={{ color: b.tc }}>{b.name} билд</div>
        <div className={styles.buildDesc} style={{ color: b.tc }}>{b.desc}</div>
      </div>

      {/* Артефакты */}
      <div className={styles.block}>
        <div className={styles.blockTitle}>Артефакты проектирования</div>
        <div className={styles.artList}>
          {b.arts.map((art, i) => (
            <div key={i} className={`${styles.artRow} ${art.s === 'no' ? styles.muted : ''}`}>
              <span className={styles.artName}>{art.n}</span>
              <span className={`${styles.artStatus} ${styles[STATUS_CLASS[art.s]]}`}>
                {STATUS_LABEL[art.s]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.backBtn} onClick={onBack}>← Назад</button>
        <button className={styles.nextBtn} onClick={onNext}>Оценить ЭБ →</button>
      </div>
    </div>
  );
}

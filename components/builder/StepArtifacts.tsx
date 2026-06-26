'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BUILDS, STATUS_LABEL, STATUS_CLASS, type BuildType } from '@/lib/data/builder';
import { Button } from '@/components/ui/Button';
import styles from './StepArtifacts.module.css';
import artStyles from '@/components/ui/ArtStatus.module.css';

interface StepArtifactsProps {
  build: BuildType;
  onNext: () => void;
  onBack: () => void;
}

export function StepArtifacts({ build, onNext, onBack }: StepArtifactsProps) {
  const b = BUILDS[build];
  const reqArts = b.arts.filter(a => a.s === 'req');
  const optArts = b.arts.filter(a => a.s !== 'req');

  return (
    <div className={styles.wrap}>
      {/* Карточка билда */}
      <div className={styles.buildCard} style={{ background: b.color }}>
        <div className={styles.buildLabel} style={{ color: b.tc }}>Билд проектирования</div>
        <div className={styles.buildNameRow}>
          <span className={styles.buildName} style={{ color: b.tc }}>{b.name}</span>
          <span className={styles.buildTypeBadge} style={{ color: b.tc }}>{b.type}</span>
        </div>
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
                <span className={`${artStyles.artStatus} ${artStyles[STATUS_CLASS[art.s]]}`}>
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
                <span className={`${artStyles.artStatus} ${artStyles[STATUS_CLASS[art.s]]}`}>
                  {STATUS_LABEL[art.s]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={15} />Назад</Button>
        <Button variant="primary" onClick={onNext}>Оценить ЭБ<ArrowRight size={15} /></Button>
      </div>
    </div>
  );
}

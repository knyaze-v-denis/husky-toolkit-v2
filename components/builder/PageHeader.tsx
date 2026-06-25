import { Banner } from '@/components/ui/Banner';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  badge?: string;
  banner?: { text: string; variant: 'info' | 'ok' | 'warn' | 'bad' } | null;
  progress?: number; // undefined = скрыть прогресс-бар
  statsLeft?: string;
  statsRight?: React.ReactNode;
  sticky?: boolean; // default true
}

export function PageHeader({
  title, badge, banner, progress, statsLeft, statsRight, sticky = true,
}: PageHeaderProps) {
  return (
    <div className={`${styles.wrap} ${sticky ? styles.sticky : ''}`}>
      <div className={styles.hdr}>
        <span className={styles.title}>{title}</span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      {banner && <Banner variant={banner.variant}>{banner.text}</Banner>}
      {progress !== undefined && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      )}
      {(statsLeft || statsRight) && (
        <div className={styles.stats}>
          <span className={styles.statsText}>{statsLeft}</span>
          {statsRight && <div className={styles.statsRight}>{statsRight}</div>}
        </div>
      )}
    </div>
  );
}

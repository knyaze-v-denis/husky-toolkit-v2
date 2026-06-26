import { Banner } from '@/components/ui/Banner';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  badge?: string;
  headerRight?: React.ReactNode;
  disclaimer?: { text: string; variant: 'info' | 'ok' | 'warn' | 'bad' };
  banner?: { text: string; variant: 'info' | 'ok' | 'warn' | 'bad' } | null;
  progress?: number;
  statsLeft?: string;
  statsRight?: React.ReactNode;
  sticky?: boolean;
}

export function PageHeader({
  title, badge, headerRight, disclaimer, banner, progress, statsLeft, statsRight, sticky = true,
}: PageHeaderProps) {
  return (
    <div className={`${styles.wrap} ${sticky ? styles.sticky : ''}`}>
      <div className={styles.hdr}>
        <span className={styles.title}>{title}</span>
        <div className={styles.hdrRight}>
          {badge && <span className={styles.badge}>{badge}</span>}
          {headerRight}
        </div>
      </div>
      {disclaimer && <Banner variant={disclaimer.variant}>{disclaimer.text}</Banner>}
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

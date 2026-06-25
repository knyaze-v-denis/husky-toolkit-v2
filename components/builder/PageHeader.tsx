import { Banner } from '@/components/ui/Banner';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  badge: string;
  banner?: { text: string; variant: 'info' | 'ok' | 'warn' | 'bad' } | null;
  progress: number; // 0–100
  statsLeft: string;
  statsRight?: React.ReactNode;
}

export function PageHeader({
  title, badge, banner, progress, statsLeft, statsRight,
}: PageHeaderProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.hdr}>
        <span className={styles.title}>{title}</span>
        <span className={styles.badge}>{badge}</span>
      </div>
      {banner && <Banner variant={banner.variant}>{banner.text}</Banner>}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.stats}>
        <span className={styles.statsText}>{statsLeft}</span>
        {statsRight && <div className={styles.statsRight}>{statsRight}</div>}
      </div>
    </div>
  );
}
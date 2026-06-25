import styles from './Banner.module.css';

interface BannerProps {
  children: React.ReactNode;
  variant?: 'info' | 'ok' | 'warn' | 'bad';
}

export function Banner({ children, variant = 'info' }: BannerProps) {
  return (
    <div className={`${styles.banner} ${styles[variant]}`}>
      {children}
    </div>
  );
}
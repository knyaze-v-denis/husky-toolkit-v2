import styles from './Block.module.css';

interface BlockProps {
  children: React.ReactNode;
}

interface BlockHeaderProps {
  children: React.ReactNode;
  color?: string;
  tc?: string;
  right?: React.ReactNode;
}

interface BlockRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  muted?: boolean;
}

export function Block({ children }: BlockProps) {
  return <div className={styles.block}>{children}</div>;
}

export function BlockHeader({ children, color, tc, right }: BlockHeaderProps) {
  return (
    <div
      className={styles.header}
      style={{ background: color, color: tc }}
    >
      <span>{children}</span>
      {right && <span className={styles.headerRight}>{right}</span>}
    </div>
  );
}

export function BlockRow({ children, onClick, muted }: BlockRowProps) {
  return (
    <div
      className={`${styles.row} ${onClick ? styles.clickable : ''} ${muted ? styles.muted : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  title,
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : '',
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

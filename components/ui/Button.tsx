'use client';

import { useState } from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    iconOnly ? styles.iconOnly : '',
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      onMouseEnter={title ? e => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
      } : undefined}
      onMouseLeave={title ? () => setPos(null) : undefined}
    >
      {children}
      {pos && <span className={styles.tip} style={{ top: pos.y, left: pos.x }}>{title}</span>}
    </button>
  );
}

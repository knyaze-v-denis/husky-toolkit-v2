import styles from './ProgressSteps.module.css';

interface Step {
  label: string;
}

interface ProgressStepsProps {
  steps: Step[];
  current: number;
  maxReached: number;
  onNavigate: (step: number) => void;
}

export function ProgressSteps({ steps, current, maxReached, onNavigate }: ProgressStepsProps) {
  return (
    <div className={styles.row}>
      {steps.map((step, i) => {
        const n = i + 1;
        const isDone   = n < current;
        const isActive = n === current;
        const canClick = n <= maxReached && n !== current;

        return (
          <div key={n} className={styles.itemWrap}>
            <div
              className={`${styles.item} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}
              onClick={() => canClick && onNavigate(n)}
              style={{ cursor: canClick ? 'pointer' : 'default' }}
            >
              <div className={styles.dot}>{n}</div>
              <span className={styles.label}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`${styles.line} ${isDone ? styles.lineDone : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
'use client';

import { ArrowRight } from 'lucide-react';
import { QUESTIONS, type Answer } from '@/lib/data/builder';
import { Button } from '@/components/ui/Button';
import styles from './StepQuestions.module.css';

interface StepQuestionsProps {
  answers: Record<string, Answer>;
  onAnswer: (id: string, answer: Answer) => void;
  onNext: () => void;
}

export function StepQuestions({ answers, onAnswer, onNext }: StepQuestionsProps) {
  const total = QUESTIONS.length;
  const answered = QUESTIONS.filter(q => answers[q.id] != null).length;
  const allAnswered = answered === total;

  return (
    <div className={styles.wrap}>
      {QUESTIONS.map((q, i) => {
        const current = answers[q.id];
        return (
          <div key={q.id} className={styles.card}>
            <div className={styles.qnum}>Вопрос {i + 1} из {total}</div>
            <div className={styles.qtext}>{q.text}</div>
            <div className={styles.hint}>{q.hint}</div>
            <div className={styles.btns}>
              <button
                className={`${styles.btn} ${current === 'yes' ? styles.active : ''}`}
                onClick={() => onAnswer(q.id, 'yes')}
              >
                Да
              </button>
              {q.maybe != null && (
                <button
                  className={`${styles.btn} ${current === 'maybe' ? styles.active : ''}`}
                  onClick={() => onAnswer(q.id, 'maybe')}
                >
                  Требуются уточнения
                </button>
              )}
              <button
                className={`${styles.btn} ${current === 'no' ? styles.active : ''}`}
                onClick={() => onAnswer(q.id, 'no')}
              >
                Нет
              </button>
            </div>
          </div>
        );
      })}

      <div className={styles.footer}>
        <Button variant="primary" onClick={onNext} disabled={!allAnswered}>
          Определить билд <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

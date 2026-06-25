'use client';

import { ProgressSteps } from '@/components/builder/ProgressSteps';
import { PageHeader } from '@/components/builder/PageHeader';
import { StepQuestions } from '@/components/builder/StepQuestions';
import { StepArtifacts } from '@/components/builder/StepArtifacts';
import { StepEB } from '@/components/builder/StepEB';
import { StepResult } from '@/components/builder/StepResult';
import { useBuilder } from '@/lib/hooks/useBuilder';
import { QUESTIONS, BUILDS, RISK_GROUPS, fmtScore } from '@/lib/data/builder';
import styles from './page.module.css';

const STEPS = [
  { label: 'Определение билда' },
  { label: 'Артефакты' },
  { label: 'Оценка ЭБ' },
  { label: 'Итог' },
];

function getBannerForStep(
  step: number,
  allAnswered: boolean,
  canProceedEB: boolean,
): { text: string; variant: 'info' | 'ok' | 'warn' | 'bad' } | null {
  if (step === 1) {
    if (!allAnswered) return { text: 'Ответьте на все вопросы, чтобы определить билд проектирования.', variant: 'info' };
    return { text: 'Все вопросы отвечены. Нажмите «Определить билд», чтобы продолжить.', variant: 'ok' };
  }
  if (step === 3 && !canProceedEB) {
    return { text: 'Выберите сложность и новизну задачи, чтобы продолжить.', variant: 'info' };
  }
  return null;
}

export default function BuilderPage() {
  const {
    state, calcQScore, calcEBScore, ebSizeResult,
    setAnswer, goToStep, setFactor, toggleRisk, reset,
  } = useBuilder();

  const { step, maxReached, answers, build, complexity, novelty, risks } = state;

  const totalQ = QUESTIONS.length;
  const answeredQ = QUESTIONS.filter(q => answers[q.id] != null).length;
  const allAnswered = answeredQ === totalQ;
  const qScore = calcQScore();
  const ebScore = calcEBScore();
  const ebSize = ebSizeResult();

  const progressQ = Math.round((answeredQ / totalQ) * 100);

  const canProceedEB = complexity != null && novelty != null;

  // Прогресс для шага 3: complexity + novelty + 3 группы рисков = 5 полей
  const ebFilledCount = [
    complexity != null,
    novelty != null,
    ...RISK_GROUPS.map(g => (risks[g.label] ?? []).length > 0),
  ].filter(Boolean).length;
  const ebTotal = 2 + RISK_GROUPS.length;
  const progressEB = Math.round((ebFilledCount / ebTotal) * 100);

  const navigate = (n: number) => {
    goToStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reqArtsCount = build ? BUILDS[build].arts.filter(a => a.s === 'req').length : 0;

  const badgeText = step === 1
    ? `${fmtScore(qScore)} баллов`
    : step === 2
    ? `${reqArtsCount} обязательных`
    : step >= 3
    ? `${fmtScore(ebScore)} баллов`
    : '';

  const banner = step === 2 || step === 4
    ? null
    : getBannerForStep(step, allAnswered, canProceedEB);

  const statsLeft = step === 1
    ? `${answeredQ} из ${totalQ} отвечено`
    : step === 3 && ebFilledCount > 0
    ? `Выбрано критериев: ${ebFilledCount} из ${ebTotal}`
    : '';

  const showProgress = step === 1 ? progressQ : step === 3 ? progressEB : undefined;

  return (
    <div>
      <div className={styles.stickyWrap}>
        <ProgressSteps
          steps={STEPS}
          current={step}
          maxReached={maxReached}
          onNavigate={navigate}
        />
        <PageHeader
          sticky={false}
          title={STEPS[step - 1].label}
          badge={badgeText}
          banner={banner}
          progress={showProgress}
          statsLeft={statsLeft}
        />
      </div>

      <div>
        {step === 1 && (
          <StepQuestions
            answers={answers}
            onAnswer={setAnswer}
            onNext={() => navigate(2)}
          />
        )}
        {step === 2 && build && (
          <StepArtifacts
            build={build}
            onBack={() => navigate(1)}
            onNext={() => navigate(3)}
          />
        )}
        {step === 3 && build && (
          <StepEB
            build={build}
            complexity={complexity}
            novelty={novelty}
            risks={risks}
            onFactor={setFactor}
            onRisk={toggleRisk}
            onBack={() => navigate(2)}
            onNext={() => navigate(4)}
          />
        )}
        {step === 4 && build && (
          <StepResult
            build={build}
            qScore={qScore}
            ebScore={ebScore}
            complexity={complexity}
            novelty={novelty}
            risks={risks}
            ebSize={ebSize}
            onBack={() => navigate(3)}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

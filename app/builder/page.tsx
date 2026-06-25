'use client';

import { ProgressSteps } from '@/components/builder/ProgressSteps';
import { PageHeader } from '@/components/builder/PageHeader';
import { StepQuestions } from '@/components/builder/StepQuestions';
import { StepArtifacts } from '@/components/builder/StepArtifacts';
import { StepEB } from '@/components/builder/StepEB';
import { StepResult } from '@/components/builder/StepResult';
import { useBuilder } from '@/lib/hooks/useBuilder';
import { QUESTIONS, BUILDS, fmtScore } from '@/lib/data/builder';

const STEPS = [
  { label: 'Определение билда' },
  { label: 'Артефакты' },
  { label: 'Оценка ЭБ' },
  { label: 'Итог' },
];

function getBannerForStep(
  step: number,
  allAnswered: boolean,
  build: string | null,
  canProceedEB: boolean,
): { text: string; variant: 'info' | 'ok' | 'warn' | 'bad' } | null {
  if (step === 1) {
    if (!allAnswered) return { text: 'Ответьте на все вопросы, чтобы определить билд проектирования.', variant: 'info' };
    return { text: `Все вопросы отвечены. Нажмите «Определить билд», чтобы продолжить.`, variant: 'ok' };
  }
  if (step === 2 && build) {
    const b = BUILDS[build as keyof typeof BUILDS];
    return { text: `Определён ${b.name.toLowerCase()} билд проектирования.`, variant: 'ok' };
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

  const progress = Math.round((answeredQ / totalQ) * 100);

  const canProceedEB = complexity != null && novelty != null;

  const badgeText = step === 1
    ? `${fmtScore(qScore)} баллов`
    : step >= 3
    ? `${fmtScore(ebScore)} ЭБ`
    : build
    ? BUILDS[build].name
    : '';

  const banner = getBannerForStep(step, allAnswered, build, canProceedEB);

  const statsLeft = step === 1
    ? `${answeredQ} из ${totalQ} отвечено`
    : step >= 3 && build
    ? `${BUILDS[build].name} билд · ${fmtScore(ebScore)} ЭБ · ${ebSize.size}`
    : '';

  return (
    <div>
      <ProgressSteps
        steps={STEPS}
        current={step}
        maxReached={maxReached}
        onNavigate={goToStep}
      />
      <PageHeader
        title={STEPS[step - 1].label}
        badge={badgeText}
        banner={banner}
        progress={step === 1 ? progress : 100}
        statsLeft={statsLeft}
      />

      <div>
        {step === 1 && (
          <StepQuestions
            answers={answers}
            onAnswer={setAnswer}
            onNext={() => goToStep(2)}
          />
        )}
        {step === 2 && build && (
          <StepArtifacts
            build={build}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
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
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
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
            onBack={() => goToStep(3)}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

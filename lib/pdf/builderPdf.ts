import { BUILDS, EB_COMPLEXITY, EB_NOVELTY, RISK_GROUPS, fmtScore, STATUS_LABEL, type BuildType } from '@/lib/data/builder';
import { pdfHeader, pdfFooter, pdfWrap, sectionLabel } from './branding';
import { renderPDF } from './render';

export interface BuilderPDFData {
  build: BuildType;
  ebScore: number;
  complexity: string | null;
  novelty: string | null;
  risks: Record<string, string[]>;
  ebSize: { size: string; time: string; range: string };
}

const ART_STYLE: Record<string, { bg: string; tc: string }> = {
  req: { bg: '#E1F5EE', tc: '#085041' },
  opt: { bg: '#F1EFE8', tc: '#5F5E5A' },
  no:  { bg: '#F5F5F5', tc: '#aaa'    },
};

const SIZE_COLORS: Record<string, { bg: string; tc: string }> = {
  SM: { bg: '#E1F5EE', tc: '#085041' },
  MD: { bg: '#FAEEDA', tc: '#633806' },
  LG: { bg: '#FAECE7', tc: '#4A1B0C' },
};

function buildHTML(data: BuilderPDFData): string {
  const { build, ebScore, complexity, novelty, risks, ebSize } = data;
  const b  = BUILDS[build];
  const sc = SIZE_COLORS[ebSize.size] ?? SIZE_COLORS.SM;

  const cpOpt = EB_COMPLEXITY.opts.find(o => o.v === complexity);
  const nvOpt = EB_NOVELTY.opts.find(o => o.v === novelty);

  const activeRisks = RISK_GROUPS.flatMap(g =>
    (risks[g.label] ?? [])
      .map(v => g.items.find(i => i.v === v))
      .filter((it): it is NonNullable<typeof it> => !!it && !it.none)
      .map(it => ({ label: g.label, item: it }))
  );

  const reqArts = b.arts.filter(a => a.s === 'req');
  const optArts = b.arts.filter(a => a.s === 'opt');

  const artRow = (name: string, s: string) => `
    <div data-nocut style="display:flex;align-items:center;gap:10px;padding:7px 14px;border-top:0.5px solid #eee;font-size:12px;background:white">
      <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;background:${ART_STYLE[s].bg};color:${ART_STYLE[s].tc}">${STATUS_LABEL[s as keyof typeof STATUS_LABEL]}</span>
      ${name}
    </div>`;

  const content = `
    ${pdfHeader('Оценка билда и ЭБ')}

    <!-- Билд -->
    <div data-nocut style="background:${b.color};border-radius:12px;padding:18px 20px;margin-bottom:1rem">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-size:20px;font-weight:600;color:${b.tc}">${b.name} билд</span>
        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:rgba(0,0,0,0.08);color:${b.tc}">${b.type}</span>
      </div>
      <div style="font-size:12px;opacity:.55;color:${b.tc};margin-bottom:8px">${b.range} баллов</div>
      <div style="font-size:13px;line-height:1.6;color:${b.tc};opacity:.75">${b.desc}</div>
    </div>

    <!-- Размер ЭБ -->
    <div data-nocut style="background:${sc.bg};border-radius:12px;padding:20px;margin-bottom:1rem;display:flex;align-items:center;gap:20px">
      <div style="font-size:52px;font-weight:700;color:${sc.tc};line-height:1">${ebSize.size}</div>
      <div>
        <div style="font-size:16px;font-weight:500;color:${sc.tc}">${ebSize.time}</div>
        <div style="font-size:13px;color:${sc.tc};opacity:.6;margin-top:2px">${ebSize.range}</div>
      </div>
    </div>

    <!-- Расчёт -->
    ${sectionLabel('Расчёт размера ЭБ')}
    <div style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:1rem">
      <div data-nocut style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;font-size:12px;background:white">
        <span>Билд проектирования: ${b.name}</span>
        <span style="font-weight:600;color:#534AB7">+${b.ebVol}</span>
      </div>
      ${cpOpt ? `<div data-nocut style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;border-top:0.5px solid #eee;font-size:12px;background:white">
        <span>Сложность: ${cpOpt.l}</span>
        <span style="font-weight:600;color:#534AB7">+${cpOpt.p}</span>
      </div>` : ''}
      ${nvOpt ? `<div data-nocut style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;border-top:0.5px solid #eee;font-size:12px;background:white">
        <span>Новизна: ${nvOpt.l}</span>
        <span style="font-weight:600;color:#534AB7">+${nvOpt.p}</span>
      </div>` : ''}
      ${activeRisks.map(({ label, item }) => `
        <div data-nocut style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;border-top:0.5px solid #eee;font-size:12px;background:white">
          <span style="color:#993C1D">⚠ Риск (${label}): ${item.l}</span>
          <span style="font-weight:600;color:#534AB7">+${item.p}</span>
        </div>`).join('')}
      <div data-nocut style="display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-top:1px solid #e0e0e0;font-size:13px;font-weight:600;background:#fafafa">
        <span>Итого</span>
        <span style="color:#3C3489">${fmtScore(ebScore)} баллов</span>
      </div>
    </div>

    ${reqArts.length > 0 ? `
      ${sectionLabel('Обязательные артефакты')}
      <div style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:1rem">
        ${reqArts.map(a => artRow(a.n, a.s)).join('')}
      </div>` : ''}

    ${optArts.length > 0 ? `
      ${sectionLabel('Дополнительные артефакты')}
      <div style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:1rem">
        ${optArts.map(a => artRow(a.n, a.s)).join('')}
      </div>` : ''}

    ${pdfFooter()}`;

  return pdfWrap(content);
}

export async function exportBuilderPDF(data: BuilderPDFData): Promise<void> {
  await renderPDF(buildHTML(data), `husky_build_${data.build}_${data.ebSize.size}.pdf`);
}

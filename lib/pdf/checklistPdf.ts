import { CHECKLISTS, type ChecklistMode } from '@/lib/data/checklists';
import { pdfHeader, pdfFooter, pdfWrap } from './branding';
import { renderPDF } from './render';

const CHECK_ON  = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const MODE_LABEL: Record<ChecklistMode, string> = {
  us: 'Чек-лист User Story',
  uc: 'Чек-лист Use Case',
  ex: 'Чек-лист Экспертная оценка',
};

function buildHTML(mode: ChecklistMode, checks: Record<string, boolean>): string {
  const cl = CHECKLISTS[mode];

  const blocks = cl.blocks.map(block => `
    <div style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div style="padding:8px 14px;background:${block.color};color:${block.tc};font-size:13px;font-weight:600">${block.title}</div>
      <div style="background:white">
        ${block.items.map((item, i) => {
          const key     = `${block.title}|${i}`;
          const checked = !!checks[key];
          return `
            <div data-nocut style="display:flex;gap:10px;padding:8px 14px;border-top:0.5px solid #eee;font-size:12px;line-height:1.5;align-items:flex-start">
              <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid ${checked ? '#3C3489' : '#ddd'};background:${checked ? '#3C3489' : 'white'};flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px">
                ${checked ? CHECK_ON : ''}
              </div>
              <div>
                <div>${item.t}${item.r ? '<sup style="color:#e53e3e;font-size:8px;margin-left:2px">•</sup>' : ''}</div>
                ${item.h ? `<div style="font-size:11px;color:#999;margin-top:2px">${item.h}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`).join('');

  const total   = cl.blocks.reduce((s, b) => s + b.items.length, 0);
  const checked = Object.values(checks).filter(Boolean).length;

  const content = `
    ${pdfHeader(MODE_LABEL[mode])}

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
      <div style="font-size:18px;font-weight:500">${cl.label}</div>
      <div style="font-size:13px;color:#aaa">${checked} из ${total} критериев</div>
    </div>

    ${blocks}
    ${pdfFooter()}`;

  return pdfWrap(content);
}

export async function exportChecklistPDF(
  mode: ChecklistMode,
  checks: Record<string, boolean>,
): Promise<void> {
  await renderPDF(buildHTML(mode, checks), `checklist_${mode}.pdf`);
}

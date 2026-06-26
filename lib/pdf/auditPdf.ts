import type { AuditEntry } from '@/lib/hooks/useAudit';
import { pdfHeader, pdfFooter, pdfWrap, sectionLabel } from './branding';
import { renderPDF } from './render';

const STATUS_BG    = { ok: '#E1F5EE', warn: '#FAEEDA', fail: '#FAECE7' };
const STATUS_TC    = { ok: '#085041', warn: '#633806', fail: '#4A1B0C' };
const STATUS_LABEL = { ok: 'Выполнено', warn: 'Частично', fail: 'Проблема' };

function statusIcon(s: 'ok' | 'warn' | 'fail') {
  const icons = {
    ok:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    warn: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BA7517" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    fail: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#993C1D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  return icons[s];
}

function arrowIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
}

function buildHTML(entry: AuditEntry): string {
  const { title, link, result } = entry;
  const { score, summary, sections = [], issues = [], recommendations = [], questions = [] } = result;

  const scoreBg    = score >= 70 ? '#E1F5EE' : score >= 40 ? '#FAEEDA' : '#FAECE7';
  const scoreTc    = score >= 70 ? '#085041' : score >= 40 ? '#854F0B' : '#993C1D';
  const scoreLabel = score >= 70 ? 'Хорошее описание' : score >= 40 ? 'Требует доработки' : 'Значительные пробелы';

  const renderSection = (sec: AuditEntry['result']['sections'][0]) => `
    <div data-nocut style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div style="padding:8px 14px;background:${STATUS_BG[sec.status]};color:${STATUS_TC[sec.status]};display:flex;justify-content:space-between;font-size:13px;font-weight:500">
        <span>${sec.title}</span><span style="font-size:11px;opacity:.8">${STATUS_LABEL[sec.status]}</span>
      </div>
      <div style="background:white">
        ${sec.items.map(item => `
          <div style="display:flex;gap:8px;padding:8px 14px;border-top:0.5px solid #eee;font-size:12px;line-height:1.5;align-items:flex-start">
            <div style="flex-shrink:0;margin-top:1px">${statusIcon(item.status)}</div>
            <span>${item.text}</span>
          </div>`).join('')}
      </div>
    </div>`;

  const renderList = (items: string[], marker: 'fail' | 'arrow' | 'num', headBg: string, headTc: string, headLabel: string) => `
    <div data-nocut style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div style="padding:8px 14px;background:${headBg};color:${headTc};font-size:13px;font-weight:500">${headLabel}</div>
      <div style="background:white">
        ${items.map((item, i) => `
          <div style="display:flex;gap:8px;padding:8px 14px;border-top:0.5px solid #eee;font-size:12px;line-height:1.5;align-items:flex-start">
            ${marker === 'num'
              ? `<span style="flex-shrink:0;font-weight:600;color:#534AB7;min-width:18px">${i + 1}.</span>`
              : marker === 'fail'
                ? `<div style="flex-shrink:0;margin-top:1px">${statusIcon('fail')}</div>`
                : `<div style="flex-shrink:0;margin-top:1px">${arrowIcon()}</div>`}
            <span>${item}</span>
          </div>`).join('')}
      </div>
    </div>`;

  const content = `
    ${pdfHeader('ИИ-аудит задачи')}

    <div style="margin-bottom:1.5rem">
      <div style="font-size:18px;font-weight:500;margin-bottom:4px">${title}</div>
      ${link ? `<div style="font-size:12px;color:#534AB7">${link}</div>` : ''}
    </div>

    <div data-nocut style="background:${scoreBg};border-radius:12px;padding:20px;margin-bottom:1.5rem;display:flex;align-items:center;gap:20px">
      <div style="font-size:52px;font-weight:700;color:${scoreTc};line-height:1">${score}</div>
      <div>
        <div style="font-size:16px;font-weight:500;color:${scoreTc}">${scoreLabel}</div>
        <div style="font-size:13px;color:${scoreTc};opacity:.75;margin-top:4px;line-height:1.5">${summary}</div>
      </div>
    </div>

    ${sectionLabel('Результаты по направлениям')}
    ${sections.map(renderSection).join('')}

    ${issues.length           ? sectionLabel('Замечания')         + renderList(issues,          'fail',  '#FAECE7', '#4A1B0C', 'Замечания')         : ''}
    ${recommendations.length  ? sectionLabel('Рекомендации')      + renderList(recommendations, 'arrow', '#E1F5EE', '#085041', 'Рекомендации')      : ''}
    ${questions.length        ? sectionLabel('Вопросы аналитику') + renderList(questions,        'num',   '#E6F1FB', '#0C447C', 'Вопросы аналитику') : ''}

    ${pdfFooter(true)}`;

  return pdfWrap(content);
}

export async function exportAuditPDF(entry: AuditEntry): Promise<void> {
  const filename = `audit_${entry.title.replace(/[^\wа-яА-Я]/g, '_').slice(0, 40)}.pdf`;
  await renderPDF(buildHTML(entry), filename);
}

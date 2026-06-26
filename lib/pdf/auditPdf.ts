import type { AuditEntry } from '@/lib/hooks/useAudit';

function pdfDate() {
  return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function statusIcon(status: 'ok' | 'warn' | 'fail') {
  const icons = {
    ok:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    warn: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BA7517" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    fail: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#993C1D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  };
  return icons[status];
}

function arrowIcon() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
}

const STATUS_BG    = { ok: '#E1F5EE', warn: '#FAEEDA', fail: '#FAECE7' };
const STATUS_TC    = { ok: '#085041', warn: '#633806', fail: '#4A1B0C' };
const STATUS_LABEL = { ok: 'Выполнено', warn: 'Частично', fail: 'Проблема' };

function buildHTML(entry: AuditEntry): string {
  const { title, link, result } = entry;
  const { score, summary, sections = [], issues = [], recommendations = [], questions = [] } = result;

  const scoreBg    = score >= 70 ? '#E1F5EE' : score >= 40 ? '#FAEEDA' : '#FAECE7';
  const scoreTc    = score >= 70 ? '#085041' : score >= 40 ? '#854F0B' : '#993C1D';
  const scoreLabel = score >= 70 ? 'Хорошее описание' : score >= 40 ? 'Требует доработки' : 'Значительные пробелы';

  const renderSection = (sec: AuditEntry['result']['sections'][0]) => `
    <div style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:10px">
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

  const renderList = (items: string[], marker: 'fail' | 'arrow' | 'num') => `
    <div style="border:0.5px solid #e0e0e0;border-radius:10px;overflow:hidden;margin-bottom:10px;background:white">
      ${items.map((item, i) => `
        <div style="display:flex;gap:8px;padding:8px 14px;border-top:0.5px solid #eee;font-size:12px;line-height:1.5;align-items:flex-start">
          ${marker === 'num'
            ? `<span style="flex-shrink:0;font-weight:600;color:#534AB7;min-width:18px">${i + 1}.</span>`
            : marker === 'fail'
              ? `<div style="flex-shrink:0;margin-top:1px">${statusIcon('fail')}</div>`
              : `<div style="flex-shrink:0;margin-top:1px">${arrowIcon()}</div>`}
          <span>${item}</span>
        </div>`).join('')}
    </div>`;

  const sectionLabel = (text: string) =>
    `<div style="font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#aaa;margin:14px 0 8px">${text}</div>`;

  return `
    <div style="background:white;width:680px;font-family:system-ui,-apple-system,sans-serif;color:#111;padding:2rem">

      <div style="display:flex;align-items:center;gap:12px;padding-bottom:1.25rem;border-bottom:1px solid #eee;margin-bottom:1.5rem">
        <div style="width:36px;height:36px;border-radius:8px;background:#3C3489;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="white" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#3C3489">Husky Toolkit · ИИ-аудит задачи</div>
          <div style="font-size:11px;color:#aaa">SimpleOne · Модель: Claude Haiku 4.5</div>
        </div>
        <div style="margin-left:auto">
          <div style="font-size:11px;color:#aaa">${pdfDate()}</div>
        </div>
      </div>

      <div style="margin-bottom:1.5rem">
        <div style="font-size:18px;font-weight:500;margin-bottom:4px">${title}</div>
        ${link ? `<div style="font-size:12px;color:#534AB7">${link}</div>` : ''}
      </div>

      <div style="background:${scoreBg};border-radius:12px;padding:20px;margin-bottom:1.5rem;display:flex;align-items:center;gap:20px">
        <div style="font-size:52px;font-weight:700;color:${scoreTc};line-height:1">${score}</div>
        <div>
          <div style="font-size:16px;font-weight:500;color:${scoreTc}">${scoreLabel}</div>
          <div style="font-size:13px;color:${scoreTc};opacity:.75;margin-top:4px;line-height:1.5">${summary}</div>
        </div>
      </div>

      ${sectionLabel('Результаты по направлениям')}
      ${sections.map(renderSection).join('')}

      ${issues.length        ? sectionLabel('Замечания')         + renderList(issues,          'fail')  : ''}
      ${recommendations.length ? sectionLabel('Рекомендации')    + renderList(recommendations, 'arrow') : ''}
      ${questions.length     ? sectionLabel('Вопросы аналитику') + renderList(questions,        'num')   : ''}

      <div style="border-top:0.5px solid #eee;margin-top:1.5rem;padding-top:1rem;font-size:11px;color:#bbb;display:flex;justify-content:space-between">
        <span>Husky Toolkit · SimpleOne</span>
        <span>Результат сгенерирован ИИ — проверяйте выводы самостоятельно</span>
      </div>
    </div>`;
}

export async function exportAuditPDF(entry: AuditEntry): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1';
  container.innerHTML = buildHTML(entry);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgW  = 210;
    const imgH  = (canvas.height * imgW) / canvas.width;
    const pdf   = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageH = 297;
    let y = 0;

    while (y < imgH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, imgW, imgH);
      y += pageH;
    }

    const filename = `audit_${entry.title.replace(/[^\wа-яА-Я]/g, '_').slice(0, 40)}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

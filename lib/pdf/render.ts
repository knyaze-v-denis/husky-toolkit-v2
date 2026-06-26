const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 10; // top margin on pages 2+ (mm) — matches pdfWrap padding (~10mm)

function raf(): Promise<void> {
  return new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export async function renderPDF(html: string, filename: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  await raf(); // wait for layout before measuring

  try {
    const wRect = wrap.getBoundingClientRect();
    const px2mm = PAGE_W / wRect.width;

    // Collect [data-nocut] bounds in mm (relative to wrap top)
    const noCut = Array.from(wrap.querySelectorAll('[data-nocut]')).map(el => {
      const r = el.getBoundingClientRect();
      return {
        top: (r.top - wRect.top) * px2mm,
        bot: (r.bottom - wRect.top) * px2mm,
      };
    });

    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pxPerMm = canvas.width / PAGE_W;
    const totalH  = (canvas.height / canvas.width) * PAGE_W; // mm

    function safeCut(target: number, lastCut: number): number {
      for (const b of noCut) {
        if (b.top > lastCut + 1 && b.top < target && target < b.bot) {
          return b.top;
        }
      }
      return target;
    }

    // Compute page start points in content-mm
    const starts: number[] = [0];
    let cur = 0;
    while (cur < totalH) {
      const avail = starts.length === 1 ? PAGE_H : PAGE_H - MARGIN;
      const next  = cur + avail;
      if (next >= totalH) break;
      const safe  = safeCut(next, cur);
      starts.push(safe);
      cur = safe;
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    for (let i = 0; i < starts.length; i++) {
      if (i > 0) pdf.addPage();

      const cStart = starts[i];
      const cEnd   = i + 1 < starts.length ? starts[i + 1] : totalH;
      const cH     = cEnd - cStart;
      const dstY   = i === 0 ? 0 : MARGIN;

      // Slice the canvas for exactly this page's content
      const sy    = Math.round(cStart * pxPerMm);
      const sh    = Math.round(cH * pxPerMm);
      if (sh <= 0) continue;

      const slice = document.createElement('canvas');
      slice.width  = canvas.width;
      slice.height = sh;
      slice.getContext('2d')!.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);

      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, dstY, PAGE_W, cH);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(wrap);
  }
}

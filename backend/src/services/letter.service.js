// Auto letter generation: merge employee data into an HTML template, wrap it in
// the company letterhead, and render to PDF via Puppeteer. If Puppeteer (or its
// bundled Chromium) is unavailable, we fall back to returning the rendered HTML
// so the feature degrades gracefully instead of crashing.

let puppeteerModule = null;
let puppeteerUnavailable = false;

async function loadPuppeteer() {
  if (puppeteerModule || puppeteerUnavailable) return puppeteerModule;
  try {
    const mod = await import('puppeteer');
    puppeteerModule = mod.default || mod;
  } catch {
    puppeteerUnavailable = true;
  }
  return puppeteerModule;
}

// Replaces {{ dotted.path }} tokens from the merge context. Unknown tokens
// resolve to an empty string so a half-filled template never leaks "{{x}}".
export function renderTemplate(body, context) {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), context);
    return value == null ? '' : String(value);
  });
}

export function buildLetterHtml({ bodyHtml, company, referenceNo, dateText }) {
  const logo = company?.logoUrl
    ? `<img src="${company.logoUrl}" alt="logo" style="max-height:64px;" />`
    : `<div class="brand">${company?.companyName || 'Company'}</div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 48px 56px; font-size: 13px; line-height: 1.6; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 28px; }
  .brand { font-size: 20px; font-weight: 700; color: #3b82f6; }
  .company-meta { text-align: right; font-size: 11px; color: #475569; }
  .ref-row { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 24px; }
  .content h1, .content h2 { color: #0f172a; }
  .signature { margin-top: 56px; }
  .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="letterhead">
    <div>${logo}</div>
    <div class="company-meta">
      <div>${company?.companyName || ''}</div>
      <div>${company?.address || ''}</div>
      <div>${company?.companyEmail || ''} ${company?.companyPhone ? '· ' + company.companyPhone : ''}</div>
    </div>
  </div>
  <div class="ref-row">
    <span>Ref: ${referenceNo}</span>
    <span>Date: ${dateText}</span>
  </div>
  <div class="content">${bodyHtml}</div>
  <div class="footer">This is a system-generated document from ${company?.companyName || 'the company'} HRMS.</div>
</body>
</html>`;
}

// Returns { buffer, mimeType, extension }. PDF when Puppeteer is present,
// otherwise an HTML document with the same content.
export async function htmlToPdf(html) {
  const puppeteer = await loadPuppeteer();
  if (!puppeteer) {
    return { buffer: Buffer.from(html, 'utf-8'), mimeType: 'text/html', extension: 'html' };
  }

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
    return { buffer: Buffer.from(pdf), mimeType: 'application/pdf', extension: 'pdf' };
  } finally {
    await browser.close();
  }
}

export function buildLetterReference(letterKey, sequence) {
  const prefix = letterKey.split('-').map((part) => part[0]).join('').toUpperCase();
  const padded = String(sequence).padStart(4, '0');
  return `${prefix}/${padded}`;
}

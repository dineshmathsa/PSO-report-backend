export function wrapReportHtml(title: string, bodyHtml: string, reportDate?: string): string {
  const dateLabel =
    reportDate ||
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 14mm 12mm 18mm 12mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, 'Segoe UI', Arial, Helvetica, sans-serif;
      color: #1f2937;
      font-size: 10.5pt;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    .report-header {
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0f4c81;
    }
    .report-title {
      color: #0f4c81;
      font-size: 20pt;
      font-weight: 700;
      margin: 0;
      line-height: 1.2;
    }
    .report-body { width: 100%; }
    .report-section { margin-bottom: 18px; }
    .section-title {
      color: #0f4c81;
      font-size: 13pt;
      font-weight: 700;
      margin: 0 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    .section-number { margin-right: 4px; }
    .summary-lead {
      margin: 0 0 12px 0;
      text-align: justify;
    }
    .summary-list {
      margin: 0 0 8px 0;
      padding-left: 0;
      list-style: none;
    }
    .summary-list.level-1 > li {
      margin-bottom: 10px;
      padding-left: 16px;
      position: relative;
    }
    .summary-list.level-1 > li::before {
      content: "●";
      position: absolute;
      left: 0;
      color: #0f4c81;
    }
    .summary-list.level-2 {
      margin-top: 6px;
      padding-left: 0;
      list-style: none;
    }
    .summary-list.level-2 > li {
      margin-bottom: 4px;
      padding-left: 18px;
      position: relative;
    }
    .summary-list.level-2 > li::before {
      content: "○";
      position: absolute;
      left: 0;
      color: #64748b;
    }
    .bottom-line {
      margin-top: 14px;
      padding: 10px 12px;
      background: #f1f5f9;
      border-left: 4px solid #0f4c81;
      font-size: 10pt;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 8px;
      font-size: 8.5pt;
    }
    .report-table thead th {
      background: #0f4c81;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      vertical-align: bottom;
      padding: 7px 6px;
      border: 1px solid #0b3d67;
      line-height: 1.2;
    }
    .report-table tbody td {
      border: 1px solid #cbd5e1;
      padding: 6px;
      vertical-align: top;
      word-wrap: break-word;
      background: #ffffff;
    }
    .report-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    .at-risk-table th:nth-child(1) { width: 18%; }
    .at-risk-table th:nth-child(2) { width: 22%; }
    .at-risk-table th:nth-child(3) { width: 34%; }
    .at-risk-table th:nth-child(4) { width: 14%; }
    .at-risk-table th:nth-child(5) { width: 12%; }
    .portfolio-table {
      font-size: 7.2pt;
    }
    .portfolio-table th,
    .portfolio-table td {
      padding: 4px 3px;
    }
    .portfolio-table th:nth-child(1) { width: 18%; }
    .project-cell {
      font-weight: 600;
      color: #0f172a;
      line-height: 1.25;
    }
    .rag-cell {
      text-align: center;
      vertical-align: middle;
    }
    .rag-circle {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.08);
    }
    .rag-circle.green { background: #22c55e; }
    .rag-circle.amber { background: #f59e0b; }
    .rag-circle.red { background: #ef4444; }
    .na {
      color: #64748b;
      font-size: 7pt;
    }
    .resource-table th,
    .resource-table td {
      font-size: 8pt;
      vertical-align: top;
      line-height: 1.35;
    }
    .resource-summary {
      margin-top: 12px;
      font-size: 9pt;
      text-align: justify;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">${escapeHtml(title)}</h1>
  </div>
  <div class="report-body">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function markdownToBasicHtml(markdown: string): string {
  return markdown;
}

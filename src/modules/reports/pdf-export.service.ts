import { Injectable, Logger } from '@nestjs/common';
import { wrapReportHtml } from './report-html.template';

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  async createPdfFromHtml(title: string, htmlBody: string, reportDate?: string): Promise<Buffer> {
    const fullHtml = wrapReportHtml(title, htmlBody, reportDate);
    return this.renderHtmlToPdf(fullHtml);
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    const puppeteer = await this.loadPuppeteer();
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width:100%; font-size:8px; color:#64748b; text-align:center; padding-top:4px; font-family: Calibri, Arial, sans-serif;">
            -- <span class="pageNumber"></span> of <span class="totalPages"></span> --
          </div>
        `,
        margin: {
          top: '14mm',
          right: '12mm',
          bottom: '16mm',
          left: '12mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (err) {
      this.logger.error(`HTML to PDF conversion failed: ${err.message}`);
      throw err;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private loadPuppeteer(): Promise<typeof import('puppeteer').default> {
    // TypeScript rewrites `import()` to `require()` under "module": "commonjs".
    // Puppeteer is ESM-only, so use a native dynamic import via Function.
    return new Function('return import("puppeteer")')().then((module: { default: typeof import('puppeteer').default }) => module.default);
  }
}

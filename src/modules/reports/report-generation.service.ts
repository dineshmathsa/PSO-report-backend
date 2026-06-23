import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { TrainingPairService } from '../training/training-pair.service';
import { PdfExportService } from './pdf-export.service';
import { PsoExcelParserService, PsoPortfolioStats } from './pso-excel-parser.service';
import { PsoReportTemplateService } from './pso-report-template.service';

export interface GeneratedReportResult {
  reply: string;
  fileName: string;
  downloadUrl: string;
  reportText: string;
  stats: PsoPortfolioStats;
}

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);
  private readonly outputDir = path.join(process.cwd(), 'data', 'generated-reports');

  constructor(
    private readonly trainingPairService: TrainingPairService,
    private readonly pdfExportService: PdfExportService,
    private readonly psoExcelParser: PsoExcelParserService,
    private readonly psoReportTemplate: PsoReportTemplateService,
  ) {
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  async generateFromExcel(uploadedExcel: Buffer, userPrompt = 'Generate PSO report'): Promise<GeneratedReportResult> {
    const pairs = this.trainingPairService.listPairs();

    if (pairs.length === 0) {
      throw new NotFoundException('No training pairs available under assets/training-data/');
    }

    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const parsedWorkbook = this.psoExcelParser.parse(uploadedExcel);

    if (parsedWorkbook.projects.length === 0) {
      throw new NotFoundException('No project rows found in the uploaded Excel file.');
    }

    const title = this.psoReportTemplate.getReportTitle(reportDate);
    const htmlBody = this.psoReportTemplate.buildReportHtml(reportDate, parsedWorkbook.stats);
    const pdfBuffer = await this.pdfExportService.createPdfFromHtml(title, htmlBody, reportDate);

    const fileName = 'PSO-Portfolio-Health-Report.pdf';
    const reportId = randomUUID();
    const storedFileName = `${reportId}.pdf`;
    const storedPath = path.join(this.outputDir, storedFileName);
    fs.writeFileSync(storedPath, pdfBuffer);

    this.logger.log(
      `Generated report ${storedFileName} from ${parsedWorkbook.stats.totalProjects} projects using template layout.`,
    );

    return {
      reply: `Your PSO report is ready! Downloading **${fileName}** now.`,
      fileName,
      downloadUrl: `/reports/generated/${storedFileName}`,
      reportText: `Generated PSO Portfolio Health Report for ${parsedWorkbook.stats.totalProjects} projects.`,
      stats: parsedWorkbook.stats,
    };
  }

  resolveGeneratedReportPath(fileName: string): string {
    const safeName = path.basename(fileName);
    const filePath = path.join(this.outputDir, safeName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Generated report not found');
    }

    return filePath;
  }
}

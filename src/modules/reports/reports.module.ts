import { Module } from '@nestjs/common';
import { VectorDBModule } from '../vector-db/vector-db.module';
import { TrainingModule } from '../training/training.module';
import { ReportGenerationService } from './report-generation.service';
import { PdfExportService } from './pdf-export.service';
import { PsoExcelParserService } from './pso-excel-parser.service';
import { PsoReportTemplateService } from './pso-report-template.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [VectorDBModule, TrainingModule],
  controllers: [ReportsController],
  providers: [
    ReportGenerationService,
    PdfExportService,
    PsoExcelParserService,
    PsoReportTemplateService,
  ],
  exports: [ReportGenerationService],
})
export class ReportsModule {}

import { Module } from '@nestjs/common';
import { VectorDBModule } from '../vector-db/vector-db.module';
import { ExcelParserService } from './excel-parser.service';
import { PdfParserService } from './pdf-parser.service';
import { TrainingPairService } from './training-pair.service';
import { TrainingIngestionService } from './training-ingestion.service';

@Module({
  imports: [VectorDBModule],
  providers: [
    ExcelParserService,
    PdfParserService,
    TrainingPairService,
    TrainingIngestionService,
  ],
  exports: [
    ExcelParserService,
    PdfParserService,
    TrainingPairService,
    TrainingIngestionService,
  ],
})
export class TrainingModule {}

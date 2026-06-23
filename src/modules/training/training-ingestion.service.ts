import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { VectorDBService } from '../vector-db/vector-db.service';
import { ExcelParserService } from './excel-parser.service';
import { PdfParserService } from './pdf-parser.service';
import { TrainingPairService } from './training-pair.service';

@Injectable()
export class TrainingIngestionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TrainingIngestionService.name);

  constructor(
    private readonly trainingPairService: TrainingPairService,
    private readonly excelParserService: ExcelParserService,
    private readonly pdfParserService: PdfParserService,
    private readonly vectorDbService: VectorDBService,
  ) {}

  async onApplicationBootstrap() {
    await this.ingestAllTrainingPairs();
  }

  async ingestAllTrainingPairs(): Promise<number> {
    const pairs = this.trainingPairService.listPairs();

    if (pairs.length === 0) {
      this.logger.warn('No training pairs found under assets/training-data/');
      return 0;
    }

    this.logger.log(`Ingesting ${pairs.length} training pair(s) into vector database...`);

    for (const pair of pairs) {
      await this.ingestPair(pair.pairId);
    }

    this.logger.log(`Training ingestion complete (${pairs.length} pairs).`);
    return pairs.length;
  }

  async ingestPair(pairId: string): Promise<void> {
    const excelBuffer = this.trainingPairService.readExcelBuffer(pairId);
    const pdfBuffer = this.trainingPairService.readPdfBuffer(pairId);

    const parsedExcel = this.excelParserService.parse(excelBuffer);
    const pdfText = await this.pdfParserService.extractText(pdfBuffer);

    await this.vectorDbService.ingestDocument(`${pairId}-excel`, parsedExcel.summary, {
      pairId,
      type: 'excel',
      sheetNames: parsedExcel.sheetNames,
    });

    await this.vectorDbService.ingestDocument(`${pairId}-pdf`, pdfText.slice(0, 6000), {
      pairId,
      type: 'pdf',
      title: this.extractTitle(pdfText),
    });

    await this.vectorDbService.ingestDocument(`${pairId}-pair`, this.buildPairDocument(parsedExcel, pdfText), {
      pairId,
      type: 'pair',
      sheetNames: parsedExcel.sheetNames,
    });

    this.logger.log(`Ingested training pair: ${pairId}`);
  }

  private buildPairDocument(parsedExcel: { sheetNames: string[]; summary: string }, pdfText: string): string {
    return [
      `Training pair mapping`,
      `Excel sheets: ${parsedExcel.sheetNames.join(', ')}`,
      `Excel excerpt:\n${parsedExcel.summary.slice(0, 2500)}`,
      `Report excerpt:\n${pdfText.slice(0, 2500)}`,
    ].join('\n\n');
  }

  private extractTitle(pdfText: string): string {
    const firstLine = pdfText
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    return firstLine || 'PSO Portfolio Health Report';
  }
}

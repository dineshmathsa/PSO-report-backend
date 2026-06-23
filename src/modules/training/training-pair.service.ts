import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TrainingPairPaths {
  pairId: string;
  excelPath: string;
  pdfPath: string;
}

@Injectable()
export class TrainingPairService {
  private readonly logger = new Logger(TrainingPairService.name);
  private readonly trainingDir = path.join(process.cwd(), 'assets', 'training-data');

  listPairs(): TrainingPairPaths[] {
    if (!fs.existsSync(this.trainingDir)) {
      this.logger.warn(`Training data directory not found: ${this.trainingDir}`);
      return [];
    }

    return fs
      .readdirSync(this.trainingDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('pair-'))
      .map((entry) => {
        const pairDir = path.join(this.trainingDir, entry.name);
        return {
          pairId: entry.name,
          excelPath: path.join(pairDir, 'source.xlsx'),
          pdfPath: path.join(pairDir, 'report.pdf'),
        };
      })
      .filter((pair) => fs.existsSync(pair.excelPath) && fs.existsSync(pair.pdfPath))
      .sort((a, b) => a.pairId.localeCompare(b.pairId));
  }

  getPair(pairId: string): TrainingPairPaths | null {
    return this.listPairs().find((pair) => pair.pairId === pairId) || null;
  }

  readExcelBuffer(pairId: string): Buffer {
    const pair = this.getPair(pairId);
    if (!pair) {
      throw new Error(`Training pair not found: ${pairId}`);
    }
    return fs.readFileSync(pair.excelPath);
  }

  readPdfBuffer(pairId: string): Buffer {
    const pair = this.getPair(pairId);
    if (!pair) {
      throw new Error(`Training pair not found: ${pairId}`);
    }
    return fs.readFileSync(pair.pdfPath);
  }
}

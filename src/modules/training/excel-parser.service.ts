import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedExcel {
  sheetNames: string[];
  text: string;
  summary: string;
}

@Injectable()
export class ExcelParserService {
  private readonly maxRowsPerSheet = 120;

  parse(buffer: Buffer): ParsedExcel {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const sections: string[] = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
      }) as unknown[][];

      const limitedRows = rows.slice(0, this.maxRowsPerSheet);
      sections.push(
        `## Sheet: ${sheetName}\n${limitedRows.map((row) => row.join('\t')).join('\n')}`,
      );
    }

    const text = sections.join('\n\n');
    const summary = `Sheets: ${sheetNames.join(', ')}\n\n${text.slice(0, 4000)}`;

    return { sheetNames, text, summary };
  }
}

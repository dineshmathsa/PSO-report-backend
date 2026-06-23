import { Injectable } from '@nestjs/common';

// pdf-parse v1 uses CommonJS default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

@Injectable()
export class PdfParserService {
  async extractText(buffer: Buffer): Promise<string> {
    const result = await pdf(buffer);
    return result.text?.trim() || '';
  }
}

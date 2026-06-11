import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private openaiEmbeddings: OpenAIEmbeddings | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      try {
        this.openaiEmbeddings = new OpenAIEmbeddings({
          openAIApiKey: apiKey,
        });
      } catch (err) {
        this.logger.warn(`Failed to initialize OpenAIEmbeddings: ${err.message}. Entering mock embeddings mode.`);
      }
    } else {
      this.logger.warn('OpenAI API key not configured. Using mock embeddings (hash-based floats).');
    }
  }

  /**
   * Creates a vector embedding for the input text.
   * Returns a 1536-dimensional array of numbers.
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (this.openaiEmbeddings) {
      try {
        return await this.openaiEmbeddings.embedQuery(text);
      } catch (err) {
        this.logger.error(`OpenAI Embeddings error: ${err.message}. Using mock fallback.`);
      }
    }
    return this.generateMockEmbedding(text);
  }

  /**
   * Helper to generate a deterministic 1536-dimension mock vector.
   */
  private generateMockEmbedding(text: string): number[] {
    const vector = new Array(1536).fill(0);
    // Simple hash based mock vector generation
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    for (let j = 0; j < 1536; j++) {
      vector[j] = Math.sin(hash + j) * 0.1;
    }
    return vector;
  }
}

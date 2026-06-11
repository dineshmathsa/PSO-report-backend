import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LanceClientProvider } from './lance.client';
import { EmbeddingsService } from './embeddings.service';

interface IngestedDocument {
  id: string;
  text: string;
  metadata: any;
  embedding: number[];
}

@Injectable()
export class VectorDBService implements OnModuleInit {
  private readonly logger = new Logger(VectorDBService.name);

  // In-memory fallback database for simulation mode
  private mockDb: IngestedDocument[] = [];

  constructor(
    private readonly lanceProvider: LanceClientProvider,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async onModuleInit() {
    if (!this.lanceProvider.isSimulationMode()) {
      this.logger.log('VectorDB service ready (LanceDB).');
    } else {
      this.logger.warn('VectorDB service running in in-memory simulation mode.');
    }
  }

  /**
   * Ingests a text document into the vector database.
   * @param id Unique identifier
   * @param text Document contents
   * @param metadata Accompanying metadata object
   */
  async ingestDocument(id: string, text: string, metadata: any = {}): Promise<void> {
    this.logger.log(`Ingesting document: ${id}...`);
    const embedding = await this.embeddingsService.createEmbedding(text);

    if (this.lanceProvider.isSimulationMode()) {
      const existingIdx = this.mockDb.findIndex((d) => d.id === id);
      const document: IngestedDocument = { id, text, metadata, embedding };

      if (existingIdx !== -1) {
        this.mockDb[existingIdx] = document;
      } else {
        this.mockDb.push(document);
      }
      this.logger.log(`Document [${id}] indexed in-memory (Simulation). DB Size: ${this.mockDb.length}`);
      return;
    }

    try {
      const table = this.lanceProvider.getTable();
      if (table) {
        await table
          .mergeInsert('id')
          .whenMatchedUpdateAll()
          .whenNotMatchedInsertAll()
          .execute([
            {
              id,
              text,
              vector: embedding,
              metadata: JSON.stringify(metadata),
            },
          ]);
        this.logger.log(`Document [${id}] successfully added to LanceDB.`);
      }
    } catch (err) {
      this.logger.error(`LanceDB ingestion failed: ${err.message}. Saving to in-memory store.`);
      this.mockDb.push({ id, text, metadata, embedding });
    }
  }

  /**
   * Performs a similarity search to find matching context documents.
   * @param query Search query text
   * @param limit Maximum results to return
   */
  async similaritySearch(query: string, limit: number = 3): Promise<Array<{ text: string; score: number; metadata: any }>> {
    this.logger.log(`Performing similarity search for query: "${query}"...`);
    const queryEmbedding = await this.embeddingsService.createEmbedding(query);

    if (this.lanceProvider.isSimulationMode()) {
      const results = this.mockDb
        .map((doc) => {
          const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
          return { text: doc.text, score, metadata: doc.metadata };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      this.logger.log(`Similarity search returned ${results.length} results (Simulation).`);
      return results;
    }

    try {
      const table = this.lanceProvider.getTable();
      if (table) {
        const queryResults = await table.vectorSearch(queryEmbedding).limit(limit).toArray();

        return queryResults.map((row) => ({
          text: (row.text as string) || '',
          score: row._distance !== undefined ? 1 - (row._distance as number) : 0.5,
          metadata: this.parseMetadata(row.metadata),
        }));
      }
    } catch (err) {
      this.logger.error(`LanceDB similarity search query failed: ${err.message}.`);
    }

    return [];
  }

  private parseMetadata(value: unknown): any {
    if (typeof value !== 'string') {
      return value ?? {};
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  /**
   * Math helper to compute cosine similarity between two vectors.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

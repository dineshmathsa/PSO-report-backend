import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LanceClientProvider } from './lance.client';
import { EmbeddingsService } from './embeddings.service';
import { VectorDBService } from './vector-db.service';

@Module({
  imports: [ConfigModule],
  providers: [LanceClientProvider, EmbeddingsService, VectorDBService],
  exports: [VectorDBService],
})
export class VectorDBModule {}

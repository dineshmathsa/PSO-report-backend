import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { VectorDBModule } from '../vector-db/vector-db.module';
import { ReportGenerationAgent } from './report-generation.agent';

@Module({
  imports: [AIModule, VectorDBModule],
  providers: [ReportGenerationAgent],
  exports: [ReportGenerationAgent],
})
export class AgentsModule {}

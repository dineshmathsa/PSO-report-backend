import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIProviderFactory } from './providers/ai-provider.factory';

@Module({
  imports: [ConfigModule],
  providers: [AIProviderFactory, AIService],
  exports: [AIService, AIProviderFactory],
})
export class AIModule {}

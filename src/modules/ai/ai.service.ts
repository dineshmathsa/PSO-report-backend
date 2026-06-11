import { Injectable, Logger } from '@nestjs/common';
import { AIProviderFactory } from './providers/ai-provider.factory';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly providerFactory: AIProviderFactory) {}

  /**
   * Generates a response from the default AI provider.
   * @param prompt Prompt string
   * @param providerOverride Optional string to force a specific provider ('groq' | 'openai' | 'ollama')
   */
  async generateResponse(prompt: string, providerOverride?: string): Promise<string> {
    this.logger.log(`Received generation request. Override: ${providerOverride || 'None'}`);
    const provider = this.providerFactory.getProvider(providerOverride);
    return provider.generate(prompt);
  }
}

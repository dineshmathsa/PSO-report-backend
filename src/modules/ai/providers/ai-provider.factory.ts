import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { GroqProvider } from './groq.provider';
import { OpenAIProvider } from './openai.provider';
import { OllamaProvider } from './ollama.provider';

@Injectable()
export class AIProviderFactory {
  private readonly logger = new Logger(AIProviderFactory.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Factory method to obtain an AI Provider.
   * @param providerType Optional override for the provider type ('groq' | 'openai' | 'ollama')
   */
  getProvider(providerType?: string): AIProvider {
    const type = (providerType || this.configService.get<string>('AI_PROVIDER') || 'groq').toLowerCase();

    if (type === 'groq') {
      const apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
      const model = this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
      const baseUrl = this.configService.get<string>('GROQ_BASE_URL') || 'https://api.groq.com/openai/v1';
      this.logger.log(`Selecting GroqProvider (model: ${model})`);
      return new GroqProvider(apiKey, model, baseUrl);
    }

    if (type === 'ollama') {
      const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
      const model = this.configService.get<string>('OLLAMA_MODEL') || 'llama2';
      this.logger.log(`Selecting OllamaProvider (model: ${model})`);
      return new OllamaProvider(baseUrl, model);
    }

    if (type === 'openai') {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4';
      this.logger.log(`Selecting OpenAIProvider (model: ${model})`);
      return new OpenAIProvider(apiKey, model);
    }

    this.logger.warn(`Unknown AI_PROVIDER "${type}". Falling back to GroqProvider.`);
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
    const model = this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant';
    const baseUrl = this.configService.get<string>('GROQ_BASE_URL') || 'https://api.groq.com/openai/v1';
    return new GroqProvider(apiKey, model, baseUrl);
  }
}

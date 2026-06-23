import { Injectable, Logger } from '@nestjs/common';
import { AIProviderFactory } from './providers/ai-provider.factory';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly providerFactory: AIProviderFactory) {}

  async generateResponse(prompt: string, providerOverride?: string): Promise<string> {
    this.logger.log(`Received generation request. Override: ${providerOverride || 'None'}`);
    const provider = this.providerFactory.getProvider(providerOverride);
    return provider.generate(prompt);
  }

  async generateChatResponse(
    messages: ChatTurn[],
    reportContextSummary?: string,
    providerOverride?: string,
  ): Promise<string> {
    const provider = this.providerFactory.getProvider(providerOverride);
    const conversation = messages
      .slice(-10)
      .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
      .join('\n\n');

    const prompt = [
      'You are an executive PSO reporting assistant. Answer the user based on the conversation and any report data provided.',
      'If report context is available, use it for portfolio, RAG, at-risk, and ramp questions.',
      'Do not tell the user to upload Excel or generate a new PDF unless they explicitly ask to generate a report.',
      'Be concise and use bullet points when listing projects.',
      reportContextSummary ? `\n--- Report Data ---\n${reportContextSummary}\n--- End Report Data ---` : '',
      `\n--- Conversation ---\n${conversation}\n--- End Conversation ---`,
      '\nReply to the latest user message only.',
    ]
      .filter(Boolean)
      .join('\n');

    return provider.generate(prompt);
  }
}

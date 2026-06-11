import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { ReportGenerationAgent } from '../agents/report-generation.agent';
import { ChatRepository } from './chat.repository';
import { ChatMessage } from './schemas/chat.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly reportAgent: ReportGenerationAgent,
    private readonly chatRepository: ChatRepository,
  ) {}

  async listChats(userId: string) {
    const chats = await this.chatRepository.findAllByUser(userId);
    return chats.map((chat) => this.toChatSummary(chat));
  }

  async createChat(userId: string, userName?: string) {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hello ${userName || 'Executive'}! How can I assist with your executive reporting and PSO analysis today?`,
      createdAt: new Date(),
    };

    const chat = await this.chatRepository.create(userId, 'New Report Chat', [welcomeMessage]);
    return this.toChatDetail(chat);
  }

  async getChat(chatId: string, userId: string) {
    const chat = await this.chatRepository.findByIdForUser(chatId, userId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return this.toChatDetail(chat);
  }

  async sendMessage(chatId: string, userId: string, message: string) {
    const chat = await this.chatRepository.findByIdForUser(chatId, userId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      createdAt: new Date(),
    };

    const reply = await this.generateReply(message);
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: reply,
      createdAt: new Date(),
    };

    const shouldUpdateTitle = chat.title === 'New Report Chat' || chat.messages.length <= 1;
    const title = shouldUpdateTitle ? this.buildTitleFromMessage(message) : undefined;

    const updatedChat = await this.chatRepository.appendMessages(
      chatId,
      userId,
      [userMessage, assistantMessage],
      title,
    );

    if (!updatedChat) {
      throw new NotFoundException('Chat not found');
    }

    return {
      reply,
      chat: this.toChatDetail(updatedChat),
    };
  }

  /**
   * Generates a reply based on user prompt. If the prompt triggers a report generation intent,
   * it delegates execution to the ReportGenerationAgent.
   */
  private async generateReply(message: string): Promise<string> {
    this.logger.log(`Processing message: "${message.slice(0, 30)}..."`);
    const prompt = message.toLowerCase();

    const isReportRequest =
      prompt.includes('report') ||
      prompt.includes('generate summary') ||
      prompt.includes('audit') ||
      prompt.includes('kpi') ||
      prompt.includes('metric');

    if (isReportRequest) {
      this.logger.log('Report generation intent detected. Invoking ReportGenerationAgent...');
      return this.reportAgent.execute(message);
    }

    this.logger.log('General chat intent detected. Querying AI Service...');
    return this.aiService.generateResponse(message);
  }

  private buildTitleFromMessage(message: string): string {
    const trimmed = message.trim();
    if (!trimmed) {
      return 'New Report Chat';
    }
    return trimmed.length > 48 ? `${trimmed.slice(0, 48).trim()}...` : trimmed;
  }

  private toChatSummary(chat: { _id: unknown; title: string; updatedAt?: Date; createdAt?: Date }) {
    return {
      id: String(chat._id),
      title: chat.title,
      updatedAt: chat.updatedAt || chat.createdAt,
    };
  }

  private toChatDetail(chat: {
    _id: unknown;
    title: string;
    messages: ChatMessage[];
    updatedAt?: Date;
    createdAt?: Date;
  }) {
    return {
      id: String(chat._id),
      title: chat.title,
      messages: chat.messages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
      updatedAt: chat.updatedAt || chat.createdAt,
    };
  }
}

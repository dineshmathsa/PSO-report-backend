import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { ChatRepository } from './chat.repository';
import { ChatMessage } from './schemas/chat.schema';
import { ReportGenerationService } from '../reports/report-generation.service';
import {
  buildReportContext,
  buildReportContextSummary,
  isExplicitReportGenerationIntent,
  isPortfolioDataQuestion,
  tryAnswerFromReportContext,
} from './report-context.helper';

interface ChatReplyResult {
  text: string;
  reportDownload?: {
    fileName: string;
    downloadUrl: string;
  };
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly chatRepository: ChatRepository,
    private readonly reportGenerationService: ReportGenerationService,
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

    const replyResult = await this.generateReply(message, chat.messages, chat.reportContext);

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      createdAt: new Date(),
    };

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: replyResult.text,
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
      reply: replyResult.text,
      reportDownload: replyResult.reportDownload,
      chat: this.toChatDetail(updatedChat),
    };
  }

  async generateReportFromExcel(
    chatId: string,
    userId: string,
    message: string,
    excelFile: Express.Multer.File,
  ) {
    if (!excelFile) {
      throw new BadRequestException('Excel file is required to generate a report.');
    }

    const chat = await this.chatRepository.findByIdForUser(chatId, userId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message?.trim() || `Uploaded Excel: ${excelFile.originalname}`,
      createdAt: new Date(),
    };

    const generated = await this.reportGenerationService.generateFromExcel(excelFile.buffer, message);
    const reportContext = buildReportContext(generated.stats, excelFile.originalname);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: generated.reply,
      createdAt: new Date(),
    };

    const shouldUpdateTitle = chat.title === 'New Report Chat' || chat.messages.length <= 1;
    const title = shouldUpdateTitle
      ? this.buildTitleFromMessage(message || excelFile.originalname)
      : undefined;

    const updatedChat = await this.chatRepository.appendMessages(
      chatId,
      userId,
      [userMessage, assistantMessage],
      title,
    );

    if (!updatedChat) {
      throw new NotFoundException('Chat not found');
    }

    await this.chatRepository.saveReportContext(chatId, userId, reportContext);

    const chatWithContext = await this.chatRepository.findByIdForUser(chatId, userId);

    return {
      reply: generated.reply,
      reportDownload: {
        fileName: generated.fileName,
        downloadUrl: generated.downloadUrl,
      },
      chat: this.toChatDetail(chatWithContext || updatedChat),
    };
  }

  private async generateReply(
    message: string,
    history: ChatMessage[],
    reportContext?: ReturnType<typeof buildReportContext>,
  ): Promise<ChatReplyResult> {
    this.logger.log(`Processing message: "${message.slice(0, 50)}..."`);

    if (isExplicitReportGenerationIntent(message)) {
      return {
        text:
          'To generate your PSO executive report, attach the source Excel file and click **Generate PDF**.',
      };
    }

    if (reportContext) {
      const contextualAnswer = tryAnswerFromReportContext(message, reportContext);
      if (contextualAnswer) {
        return { text: contextualAnswer };
      }
    }

    if (isPortfolioDataQuestion(message) && !reportContext) {
      return {
        text:
          'I do not have report data in this chat yet. Attach an Excel file and click **Generate PDF** first, then ask me about amber, red, at-risk, or ramp status.',
      };
    }

    const conversation = history.map((entry) => ({
      role: entry.role as 'user' | 'assistant',
      content: entry.content,
    }));
    conversation.push({ role: 'user', content: message });

    const contextSummary = reportContext ? buildReportContextSummary(reportContext) : undefined;
    const text = await this.aiService.generateChatResponse(conversation, contextSummary);
    return { text };
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
    reportContext?: ReturnType<typeof buildReportContext>;
  }) {
    return {
      id: String(chat._id),
      title: chat.title,
      messages: chat.messages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
      hasReportContext: !!chat.reportContext,
      updatedAt: chat.updatedAt || chat.createdAt,
    };
  }
}

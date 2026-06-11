import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, ChatMessage } from './schemas/chat.schema';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
  ) {}

  async create(userId: string, title: string, messages: ChatMessage[] = []): Promise<ChatDocument> {
    const chat = new this.chatModel({
      userId: new Types.ObjectId(userId),
      title,
      messages,
    });
    return chat.save();
  }

  async findAllByUser(userId: string): Promise<ChatDocument[]> {
    return this.chatModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findByIdForUser(chatId: string, userId: string): Promise<ChatDocument | null> {
    return this.chatModel
      .findOne({
        _id: new Types.ObjectId(chatId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  async appendMessages(
    chatId: string,
    userId: string,
    messages: ChatMessage[],
    title?: string,
  ): Promise<ChatDocument | null> {
    const update: Record<string, unknown> = {
      $push: { messages: { $each: messages } },
    };

    if (title) {
      update.$set = { title };
    }

    return this.chatModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(chatId),
          userId: new Types.ObjectId(userId),
        },
        update,
        { new: true },
      )
      .exec();
  }
}

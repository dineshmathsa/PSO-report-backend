import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ _id: false })
export class ChatReportContext {
  @Prop({ required: true })
  generatedAt: Date;

  @Prop()
  sourceFileName?: string;

  @Prop({ required: true })
  totalProjects: number;

  @Prop({ required: true })
  atRiskCount: number;

  @Prop({ required: true })
  redCount: number;

  @Prop({ required: true })
  amberCount: number;

  @Prop({ type: [String], default: [] })
  redProjects: string[];

  @Prop({ required: true })
  rampTotal: string;

  @Prop({ required: true })
  rampProjectCount: number;

  @Prop({ type: [Object], default: [] })
  atRiskProjects: Array<{ name: string; overallRag: string; risks: string }>;

  @Prop({ type: [Object], default: [] })
  projects: Array<{
    name: string;
    overallRag: string;
    schedule: string;
    budget: string;
    quality: string;
    v360Rag: string;
    rampRag: string;
    rampArr: string;
  }>;
}

export const ChatReportContextSchema = SchemaFactory.createForClass(ChatReportContext);

@Schema({ timestamps: true })
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'New Report Chat' })
  title: string;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];

  @Prop({ type: ChatReportContextSchema, default: null })
  reportContext?: ChatReportContext;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

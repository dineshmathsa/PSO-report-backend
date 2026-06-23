import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'List chat sessions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Chat sessions returned successfully' })
  async listChats(@Req() req: any) {
    return this.chatService.listChats(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({ status: 201, description: 'Chat session created successfully' })
  async createChat(@Req() req: any) {
    return this.chatService.createChat(req.user.userId, req.user.name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat session with its messages' })
  @ApiResponse({ status: 200, description: 'Chat session returned successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChat(@Param('id') id: string, @Req() req: any) {
    return this.chatService.getChat(id, req.user.userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a chat session and receive an AI reply' })
  @ApiResponse({ status: 200, description: 'Message sent and reply generated successfully' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async sendMessage(
    @Param('id') id: string,
    @Body() chatMessageDto: ChatMessageDto,
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(id, req.user.userId, chatMessageDto.message);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Upload Excel and generate an executive report PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async generateReport(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('message') message: string,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Excel file is required.');
    }

    const allowedExtensions = ['.xlsx', '.xls'];
    const lowerName = file.originalname.toLowerCase();
    const isExcel = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isExcel) {
      throw new BadRequestException('Only Excel files (.xlsx, .xls) are supported.');
    }

    return this.chatService.generateReportFromExcel(id, req.user.userId, message, file);
  }
}

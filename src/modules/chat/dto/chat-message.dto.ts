import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({
    example: 'Generate weekly PSO report',
    description: 'The prompt or message for the AI Executive Reporting Assistant',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

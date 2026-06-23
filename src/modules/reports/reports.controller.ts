import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportGenerationService } from './report-generation.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportGenerationService: ReportGenerationService) {}

  @Get('generated/:fileName')
  @ApiOperation({ summary: 'Download a generated executive report PDF' })
  @ApiResponse({ status: 200, description: 'Generated PDF returned successfully' })
  @ApiResponse({ status: 404, description: 'Generated report not found' })
  downloadGeneratedReport(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = this.reportGenerationService.resolveGeneratedReportPath(fileName);
    const safeName = decodeURIComponent(fileName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName.replace(/"/g, '')}"`,
    );
    return res.sendFile(filePath);
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API health checks' })
  checkHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Executive Reporting API',
    };
  }
}

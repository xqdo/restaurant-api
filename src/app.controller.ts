import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is running', schema: { example: { message: 'Restaurant API is running', version: '1.0.0', timestamp: '2025-12-28T10:30:00.000Z' } } })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

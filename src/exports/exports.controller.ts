import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Logger,
  StreamableFile,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExportRequestDto } from './dto/export-request.dto';
import { CustomReportDto } from './dto/custom-report.dto';

@ApiTags('exports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
@Controller('exports')
export class ExportsController {
  private readonly logger = new Logger(ExportsController.name);

  constructor(private readonly exportsService: ExportsService) {}

  @Get('sales/csv')
  @ApiOperation({ summary: 'Export sales data to CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales_report.csv"')
  @ApiResponse({
    status: 200,
    description: 'CSV file download',
  })
  async exportSalesToCsv(@Query() dto: ExportRequestDto): Promise<StreamableFile> {
    this.logger.log(`GET /exports/sales/csv - ${JSON.stringify(dto)}`);
    const buffer = await this.exportsService.exportSalesToCsv(dto);
    return new StreamableFile(buffer);
  }

  @Get('receipts/excel')
  @ApiOperation({ summary: 'Export receipts to Excel with multiple sheets' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="receipts_report.xlsx"')
  @ApiResponse({
    status: 200,
    description: 'Excel file download',
  })
  async exportReceiptsToExcel(
    @Query() dto: ExportRequestDto,
  ): Promise<StreamableFile> {
    this.logger.log(`GET /exports/receipts/excel - ${JSON.stringify(dto)}`);
    const buffer = await this.exportsService.exportReceiptsToExcel(dto);
    return new StreamableFile(buffer);
  }

  @Get('items/csv')
  @ApiOperation({ summary: 'Export menu items to CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="menu_items.csv"')
  @ApiResponse({
    status: 200,
    description: 'CSV file download',
  })
  async exportItemsToCsv(): Promise<StreamableFile> {
    this.logger.log(`GET /exports/items/csv`);
    const buffer = await this.exportsService.exportItemsToCsv();
    return new StreamableFile(buffer);
  }

  @Post('custom')
  @ApiOperation({ summary: 'Generate custom report with selected columns and filters' })
  @ApiResponse({
    status: 200,
    description: 'Custom report file download',
  })
  async generateCustomReport(
    @Body() dto: CustomReportDto,
  ): Promise<StreamableFile> {
    this.logger.log(`POST /exports/custom - ${JSON.stringify(dto)}`);
    const buffer = await this.exportsService.generateCustomReport(dto);

    const filename =
      dto.format === 'excel' ? 'custom_report.xlsx' : 'custom_report.csv';
    const contentType =
      dto.format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';

    // Note: We can't use decorators dynamically, so we set headers in code
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

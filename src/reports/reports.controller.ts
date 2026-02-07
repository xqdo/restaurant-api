import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  SalesReportDto,
  PeriodSalesReportDto,
} from './dto/sales-report.dto';
import { TopItemsReportDto, TopItemsQueryDto } from './dto/top-items-report.dto';
import { DiscountUsageReportDto } from './dto/discount-usage-report.dto';
import { StaffPerformanceReportDto } from './dto/staff-performance-report.dto';
import { TableTurnoverReportDto } from './dto/table-turnover-report.dto';
import { RevenueBySectionReportDto } from './dto/revenue-by-section-report.dto';
import {
  InventoryStatusReportDto,
  StockMovementReportDto,
  PurchaseCostReportDto,
  WasteReportDto,
  VendorPerformanceReportDto,
} from './dto/inventory-report.dto';
import { DateRangeDto } from './dto/date-range.dto';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales/daily')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2025-12-28',
    description: 'Date in YYYY-MM-DD format',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily sales report',
    type: SalesReportDto,
  })
  async getDailySales(@Query('date') date: string): Promise<SalesReportDto> {
    this.logger.log(`GET /reports/sales/daily - Date: ${date}`);
    return this.reportsService.getDailySales(date);
  }

  @Get('sales/period')
  @ApiOperation({ summary: 'Get sales report for a period' })
  @ApiResponse({
    status: 200,
    description: 'Period sales report',
    type: PeriodSalesReportDto,
  })
  async getPeriodSales(
    @Query() dto: DateRangeDto,
  ): Promise<PeriodSalesReportDto> {
    this.logger.log(`GET /reports/sales/period - ${JSON.stringify(dto)}`);
    return this.reportsService.getPeriodSales(dto);
  }

  @Get('items/top-selling')
  @ApiOperation({ summary: 'Get top selling items report' })
  @ApiQuery({
    name: 'period',
    required: false,
    example: '7days',
    description: 'Period: 7days, 30days, 90days',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of top items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Top selling items report',
    type: TopItemsReportDto,
  })
  async getTopSellingItems(
    @Query() dto: TopItemsQueryDto,
  ): Promise<TopItemsReportDto> {
    this.logger.log(`GET /reports/items/top-selling - ${JSON.stringify(dto)}`);
    return this.reportsService.getTopSellingItems(dto);
  }

  @Get('items/slow-moving')
  @ApiOperation({ summary: 'Get slow-moving items report' })
  @ApiQuery({
    name: 'period',
    required: false,
    example: '30days',
    description: 'Period: 7days, 30days, 90days',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Slow-moving items report',
    type: TopItemsReportDto,
  })
  async getSlowMovingItems(
    @Query() dto: TopItemsQueryDto,
  ): Promise<TopItemsReportDto> {
    this.logger.log(`GET /reports/items/slow-moving - ${JSON.stringify(dto)}`);
    // Reuse top selling logic but reverse sort
    const result = await this.reportsService.getTopSellingItems({
      ...dto,
      limit: 100, // Get more items to find slow movers
    });

    // Reverse the array to get slow movers
    result.items = result.items.reverse().slice(0, dto.limit || 10);
    return result;
  }

  @Get('revenue/by-section')
  @ApiOperation({ summary: 'Get revenue breakdown by menu section' })
  @ApiResponse({
    status: 200,
    description: 'Revenue by section report',
    type: RevenueBySectionReportDto,
  })
  async getRevenueBySection(
    @Query() dto: DateRangeDto,
  ): Promise<RevenueBySectionReportDto> {
    this.logger.log(`GET /reports/revenue/by-section - ${JSON.stringify(dto)}`);
    return this.reportsService.getRevenueBySection(dto);
  }

  @Get('staff/performance')
  @ApiOperation({ summary: 'Get staff performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Staff performance report',
    type: StaffPerformanceReportDto,
  })
  async getStaffPerformance(
    @Query() dto: DateRangeDto,
  ): Promise<StaffPerformanceReportDto> {
    this.logger.log(`GET /reports/staff/performance - ${JSON.stringify(dto)}`);
    return this.reportsService.getStaffPerformance(dto);
  }

  @Get('tables/turnover')
  @ApiOperation({ summary: 'Get table turnover and utilization report' })
  @ApiResponse({
    status: 200,
    description: 'Table turnover report',
    type: TableTurnoverReportDto,
  })
  async getTableTurnover(
    @Query() dto: DateRangeDto,
  ): Promise<TableTurnoverReportDto> {
    this.logger.log(`GET /reports/tables/turnover - ${JSON.stringify(dto)}`);
    return this.reportsService.getTableTurnover(dto);
  }

  @Get('discounts/usage')
  @ApiOperation({ summary: 'Get discount usage and effectiveness report' })
  @ApiResponse({
    status: 200,
    description: 'Discount usage report',
    type: DiscountUsageReportDto,
  })
  async getDiscountUsage(
    @Query() dto: DateRangeDto,
  ): Promise<DiscountUsageReportDto> {
    this.logger.log(`GET /reports/discounts/usage - ${JSON.stringify(dto)}`);
    return this.reportsService.getDiscountUsage(dto);
  }

  // --- Inventory & Vendor Reports ---

  @Get('inventory/status')
  @ApiOperation({ summary: 'Get current inventory status (snapshot)' })
  @ApiResponse({
    status: 200,
    description: 'Inventory status report',
    type: InventoryStatusReportDto,
  })
  async getInventoryStatus(): Promise<InventoryStatusReportDto> {
    this.logger.log('GET /reports/inventory/status');
    return this.reportsService.getInventoryStatus();
  }

  @Get('inventory/movement')
  @ApiOperation({ summary: 'Get stock movement report (entries & usages)' })
  @ApiResponse({
    status: 200,
    description: 'Stock movement report',
    type: StockMovementReportDto,
  })
  async getStockMovement(
    @Query() dto: DateRangeDto,
  ): Promise<StockMovementReportDto> {
    this.logger.log(`GET /reports/inventory/movement - ${JSON.stringify(dto)}`);
    return this.reportsService.getStockMovement(dto);
  }

  @Get('inventory/purchases')
  @ApiOperation({ summary: 'Get purchase cost report' })
  @ApiResponse({
    status: 200,
    description: 'Purchase cost report',
    type: PurchaseCostReportDto,
  })
  async getPurchaseCost(
    @Query() dto: DateRangeDto,
  ): Promise<PurchaseCostReportDto> {
    this.logger.log(`GET /reports/inventory/purchases - ${JSON.stringify(dto)}`);
    return this.reportsService.getPurchaseCost(dto);
  }

  @Get('inventory/waste')
  @ApiOperation({ summary: 'Get waste and expired items report' })
  @ApiResponse({
    status: 200,
    description: 'Waste report',
    type: WasteReportDto,
  })
  async getWasteReport(
    @Query() dto: DateRangeDto,
  ): Promise<WasteReportDto> {
    this.logger.log(`GET /reports/inventory/waste - ${JSON.stringify(dto)}`);
    return this.reportsService.getWasteReport(dto);
  }

  @Get('vendors/performance')
  @ApiOperation({ summary: 'Get vendor performance report' })
  @ApiResponse({
    status: 200,
    description: 'Vendor performance report',
    type: VendorPerformanceReportDto,
  })
  async getVendorPerformance(
    @Query() dto: DateRangeDto,
  ): Promise<VendorPerformanceReportDto> {
    this.logger.log(`GET /reports/vendors/performance - ${JSON.stringify(dto)}`);
    return this.reportsService.getVendorPerformance(dto);
  }
}

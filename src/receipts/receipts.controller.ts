import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { ReceiptItemsService } from './receipt-items/receipt-items.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptItemStatusDto } from './dto/update-receipt-item-status.dto';
import { FilterReceiptsDto } from './dto/filter-receipts.dto';
import { ReceiptDetailResponseDto } from './dto/receipt-detail-response.dto';
import { ReceiptTotalBreakdownDto } from './dto/receipt-total-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  BadRequestResponseDto,
  InternalServerErrorResponseDto,
} from '../common/dto/error-response.dto';

@ApiTags('orders')
@Controller('receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReceiptsController {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly receiptItemsService: ReceiptItemsService,
  ) {}

  @ApiOperation({
    summary: 'Create new receipt/order',
    description: `
      Create a new order/receipt for dine-in or delivery.

      **Business Rules:**
      - For dine-in orders: table_id is required, phone_number and location are optional
      - For delivery orders: phone_number and location are required, table_id is optional
      - At least one item must be included in the order
      - All items must exist in the menu
      - For dine-in: table must exist and not be deleted
      - All items start with status "pending"

      **Item Status Workflow:**
      pending → preparing → ready → done
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Receipt created successfully',
    type: ReceiptDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed (missing required fields, invalid item IDs, etc.)',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Waiter, Manager, or Admin role required',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Table or menu item not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @Roles('Waiter', 'Manager', 'Admin')
  @Post()
  create(@Body() dto: CreateReceiptDto, @CurrentUser() user: any) {
    return this.receiptsService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List all receipts with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of receipts with pagination',
  })
  @Get()
  findAll(@Query() query: FilterReceiptsDto) {
    return this.receiptsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get receipt by ID with full details' })
  @ApiResponse({
    status: 200,
    description: 'Receipt details including items, totals, and discounts',
  })
  @ApiResponse({
    status: 404,
    description: 'Receipt not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Receipt ID',
    type: Number,
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update receipt item status (kitchen workflow)' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Receipt item not found',
  })
  @ApiParam({
    name: 'receiptId',
    description: 'Receipt ID',
    type: Number,
  })
  @ApiParam({
    name: 'itemId',
    description: 'Receipt Item ID',
    type: Number,
  })
  @Roles('Kitchen', 'Waiter', 'Manager', 'Admin')
  @Put(':receiptId/items/:itemId/status')
  updateItemStatus(
    @Param('receiptId', ParseIntPipe) receiptId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateReceiptItemStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.receiptItemsService.updateStatus(
      receiptId,
      itemId,
      dto.status,
      user.id,
    );
  }

  @ApiOperation({ summary: 'Complete receipt (mark as paid)' })
  @ApiResponse({
    status: 200,
    description: 'Receipt completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Receipt not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Receipt ID',
    type: Number,
  })
  @Roles('Waiter', 'Manager', 'Admin')
  @Put(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.receiptsService.complete(id, user.id);
  }

  @ApiOperation({
    summary: 'Get receipt totals (subtotal, discount, total)',
    description: `
      Calculate and return the complete pricing breakdown for a receipt.

      **Calculation:**
      1. Subtotal = Sum of (item price × quantity) for all items
      2. Discount Amount = Sum of all applied discounts
      3. Total = Subtotal - Discount Amount

      **Returns:**
      - Subtotal before discounts
      - Total discount amount applied
      - Final total
      - Number of items
      - List of applied discount codes
      - Total savings
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Receipt totals calculated successfully',
    type: ReceiptTotalBreakdownDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Receipt not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @ApiParam({
    name: 'id',
    description: 'Receipt ID',
    type: Number,
    example: 125,
  })
  @Get(':id/total')
  async getTotal(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.calculateTotal(id);
  }
}

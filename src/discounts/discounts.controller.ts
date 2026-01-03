import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { DiscountEngineService } from './discount-engine.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
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

@ApiTags('discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DiscountsController {
  constructor(
    private readonly discountsService: DiscountsService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  @ApiOperation({ summary: 'Create new discount' })
  @ApiResponse({ status: 201, description: 'Discount created' })
  @Roles('Admin', 'Manager')
  @Post()
  create(@Body() dto: CreateDiscountDto, @CurrentUser() user: any) {
    return this.discountsService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Get all discounts' })
  @ApiResponse({ status: 200, description: 'List of discounts' })
  @Get()
  findAll() {
    return this.discountsService.findAll();
  }

  @ApiOperation({ summary: 'Get discount by ID' })
  @ApiResponse({ status: 200, description: 'Discount details' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update discount' })
  @ApiResponse({ status: 200, description: 'Discount updated' })
  @Roles('Admin', 'Manager')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiscountDto,
    @CurrentUser() user: any,
  ) {
    return this.discountsService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete discount' })
  @ApiResponse({ status: 200, description: 'Discount deleted' })
  @Roles('Admin', 'Manager')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.discountsService.remove(id, user.id);
  }

  @ApiOperation({ summary: 'Toggle discount active status' })
  @ApiResponse({ status: 200, description: 'Status toggled' })
  @Roles('Admin', 'Manager')
  @Put(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.discountsService.toggleActive(id, user.id);
  }

  @ApiOperation({
    summary: 'Apply discount to receipt',
    description: `
      Apply a discount code to a receipt/order with automatic validation.

      **Validation Rules:**
      - Discount must be active (is_active = true)
      - Current date must be between start_date and end_date
      - Discount usage must not exceed max_receipts (if set)
      - Minimum order amount must be met (if condition exists)
      - Day of week must match valid_days (if condition exists)
      - For combo discounts: receipt must contain eligible items

      **Discount Types:**
      - **amount**: Fixed dollar amount off total
      - **percentage**: Percentage off total (0-100%)
      - **combo**: Special combo pricing for specific items

      **Multiple Discounts:**
      - Multiple discounts can be applied to the same receipt
      - Discounts are cumulative

      **Returns:**
      - Updated receipt total
      - Discount amount applied
      - Receipt details with applied discounts
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Discount applied successfully',
    schema: {
      example: {
        receipt_id: 125,
        discount_applied: {
          code: 'SUMMER20',
          name: 'Summer Sale',
          type: 'percentage',
          discount_amount: 17.90,
        },
        subtotal: 89.50,
        total_discount: 17.90,
        new_total: 71.60,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid discount code, conditions not met, expired, or max usage reached',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Waiter, Cashier, Manager, or Admin role required',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Discount code or receipt not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @Roles('Waiter', 'Cashier', 'Manager', 'Admin')
  @Post('apply')
  applyDiscount(@Body() dto: ApplyDiscountDto, @CurrentUser() user: any) {
    return this.discountEngine.applyDiscount(dto.code, dto.receipt_id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DeliveryReceiptsService } from './delivery-receipts.service';
import { AssignDeliveryDto } from '../dto/assign-delivery.dto';
import { MarkPaidDto } from '../dto/mark-paid.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('delivery-orders')
@Controller('delivery/receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DeliveryReceiptsController {
  constructor(
    private readonly deliveryReceiptsService: DeliveryReceiptsService,
  ) {}

  @ApiOperation({ summary: 'Assign receipt to delivery driver' })
  @ApiResponse({ status: 201, description: 'Delivery assigned' })
  @Roles('Manager', 'Admin')
  @Post('assign')
  assignDelivery(@Body() dto: AssignDeliveryDto, @CurrentUser() user: any) {
    return this.deliveryReceiptsService.assignDelivery(dto, user.id);
  }

  @ApiOperation({ summary: 'Get all delivery receipts' })
  @ApiResponse({ status: 200, description: 'List of delivery receipts' })
  @ApiQuery({ name: 'driver_id', required: false })
  @ApiQuery({ name: 'is_paid', required: false })
  @Get()
  findAll(
    @Query('driver_id') driverId?: string,
    @Query('is_paid') isPaid?: string,
  ) {
    const filters: any = {};
    if (driverId) filters.driver_id = parseInt(driverId);
    if (isPaid !== undefined) filters.is_paid = isPaid === 'true';
    return this.deliveryReceiptsService.findAll(filters);
  }

  @ApiOperation({ summary: 'Get delivery receipt by ID' })
  @ApiResponse({ status: 200, description: 'Delivery receipt details' })
  @ApiResponse({ status: 404, description: 'Delivery receipt not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryReceiptsService.findOne(id);
  }

  @ApiOperation({ summary: 'Mark delivery as paid/unpaid' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @Roles('Manager', 'Cashier', 'Admin')
  @Put(':id/payment')
  markPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkPaidDto,
  ) {
    return this.deliveryReceiptsService.markPaid(id, dto.is_paid);
  }

  @ApiOperation({ summary: 'Get unpaid deliveries for a driver' })
  @ApiResponse({ status: 200, description: 'List of unpaid deliveries' })
  @Get('driver/:driverId/unpaid')
  getUnpaidDeliveries(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.deliveryReceiptsService.getUnpaidDeliveries(driverId);
  }
}

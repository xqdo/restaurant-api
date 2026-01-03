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
import { DeliveryGuysService } from './delivery-guys.service';
import { CreateDeliveryGuyDto } from '../dto/create-delivery-guy.dto';
import { UpdateDeliveryGuyDto } from '../dto/update-delivery-guy.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('delivery-drivers')
@Controller('delivery/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DeliveryGuysController {
  constructor(private readonly deliveryGuysService: DeliveryGuysService) {}

  @ApiOperation({ summary: 'Register new delivery driver' })
  @ApiResponse({ status: 201, description: 'Driver registered' })
  @Roles('Admin', 'Manager')
  @Post()
  create(@Body() dto: CreateDeliveryGuyDto, @CurrentUser() user: any) {
    return this.deliveryGuysService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Get all delivery drivers' })
  @ApiResponse({ status: 200, description: 'List of drivers' })
  @Get()
  findAll() {
    return this.deliveryGuysService.findAll();
  }

  @ApiOperation({ summary: 'Get driver by ID' })
  @ApiResponse({ status: 200, description: 'Driver details' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryGuysService.findOne(id);
  }

  @ApiOperation({ summary: 'Get driver statistics' })
  @ApiResponse({ status: 200, description: 'Driver statistics' })
  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryGuysService.getStats(id);
  }

  @ApiOperation({ summary: 'Update driver' })
  @ApiResponse({ status: 200, description: 'Driver updated' })
  @Roles('Admin', 'Manager')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeliveryGuyDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryGuysService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete driver' })
  @ApiResponse({ status: 200, description: 'Driver deleted' })
  @Roles('Admin', 'Manager')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.deliveryGuysService.remove(id, user.id);
  }
}

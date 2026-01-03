import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('kitchen')
@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @ApiOperation({
    summary: 'Get all pending items for kitchen',
    description: 'Returns all receipt items with status pending or preparing, ordered by creation time (oldest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending items',
  })
  @Roles('Kitchen', 'Manager', 'Admin')
  @Get('pending')
  getPendingItems() {
    return this.kitchenService.getPendingItems();
  }

  @ApiOperation({
    summary: 'Get pending items grouped by table/receipt',
    description: 'Returns pending items organized by order for easier kitchen management',
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders with their items',
  })
  @Roles('Kitchen', 'Manager', 'Admin')
  @Get('by-table')
  getItemsByTable() {
    return this.kitchenService.getItemsByTable();
  }
}

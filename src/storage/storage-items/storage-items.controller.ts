import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
} from '@nestjs/swagger';
import { StorageItemsService } from './storage-items.service';
import { CreateStorageItemDto } from '../dto/create-storage-item.dto';
import { UpdateStorageItemDto } from '../dto/update-storage-item.dto';
import { FilterStorageItemsDto } from '../dto/filter-storage-items.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  BadRequestResponseDto,
  InternalServerErrorResponseDto,
} from '../../common/dto/error-response.dto';

@ApiTags('storage-items')
@Controller('storage/items')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StorageItemsController {
  constructor(private readonly storageItemsService: StorageItemsService) {}

  @ApiOperation({
    summary: 'Get all storage items with optional filters',
    description: `
      Retrieve a list of storage items/ingredients.

      **Available Filters:**
      - search: Search by item name
      - unit: Filter by unit of measurement
      - low_stock: Filter items below min_quantity threshold
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of storage items',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @Get()
  findAll(@Query() query: FilterStorageItemsDto) {
    return this.storageItemsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get low stock items',
    description: 'Returns items where current_quantity is below min_quantity threshold',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of low stock items',
  })
  @Get('low-stock')
  getLowStockItems() {
    return this.storageItemsService.getLowStockItems();
  }

  @ApiOperation({ summary: 'Get storage item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns storage item details with recent entries and usages',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage item not found',
    type: NotFoundResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storageItemsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create new storage item (Manager/Admin only)',
    description: `
      Add a new storage item/ingredient to the inventory.

      **Fields:**
      - name: Item name (required)
      - description: Item description (optional)
      - unit: Unit of measurement - kg, g, liter, ml, piece, pack, box (required)
      - min_quantity: Low stock threshold (optional)
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Storage item created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
    type: ForbiddenResponseDto,
  })
  @Roles('Admin', 'Manager')
  @Post()
  create(@Body() createDto: CreateStorageItemDto, @CurrentUser() user: User) {
    return this.storageItemsService.create(createDto, user.id);
  }

  @ApiOperation({ summary: 'Update storage item (Manager/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Storage item updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage item not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
    type: ForbiddenResponseDto,
  })
  @Roles('Admin', 'Manager')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStorageItemDto,
    @CurrentUser() user: User,
  ) {
    return this.storageItemsService.update(id, updateDto, user.id);
  }

  @ApiOperation({ summary: 'Soft delete storage item (Manager/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Storage item deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage item not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
    type: ForbiddenResponseDto,
  })
  @Roles('Admin', 'Manager')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.storageItemsService.remove(id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
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
import { StorageEntriesService } from './storage-entries.service';
import { CreateStorageEntryDto } from '../dto/create-storage-entry.dto';
import { FilterStorageEntriesDto } from '../dto/filter-storage-entries.dto';
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
} from '../../common/dto/error-response.dto';

@ApiTags('storage-entries')
@Controller('storage/entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StorageEntriesController {
  constructor(private readonly storageEntriesService: StorageEntriesService) {}

  @ApiOperation({
    summary: 'Get all storage entries (stock-in records)',
    description: `
      Retrieve a list of stock entry records.

      **Available Filters:**
      - storage_item_id: Filter by storage item
      - supplier: Filter by supplier name
      - start_date: Filter entries after this date
      - end_date: Filter entries before this date
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of storage entries',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @Get()
  findAll(@Query() query: FilterStorageEntriesDto) {
    return this.storageEntriesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get storage entry by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns storage entry details',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage entry not found',
    type: NotFoundResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storageEntriesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create new storage entry - receive stock (Manager/Admin/Kitchen)',
    description: `
      Record a new stock entry (receiving inventory).
      This will automatically increase the current_quantity of the storage item.

      **Fields:**
      - storage_item_id: ID of the storage item (required)
      - quantity: Amount received (required, must be > 0)
      - unit_price: Cost per unit (optional)
      - supplier: Supplier name (optional)
      - notes: Additional notes (optional)
      - entry_date: When stock was received (optional, defaults to now)
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Storage entry created and quantity increased',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Storage item not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager, Admin, or Kitchen role required',
    type: ForbiddenResponseDto,
  })
  @Roles('Admin', 'Manager', 'Kitchen')
  @Post()
  create(@Body() createDto: CreateStorageEntryDto, @CurrentUser() user: User) {
    return this.storageEntriesService.create(createDto, user.id);
  }

  @ApiOperation({
    summary: 'Delete storage entry - reverse stock (Manager/Admin only)',
    description: `
      Soft delete a storage entry.
      This will automatically decrease the current_quantity of the storage item.

      **Note:** Cannot delete if it would result in negative quantity.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Storage entry deleted and quantity reversed',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - would result in negative quantity',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Storage entry not found',
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
    return this.storageEntriesService.remove(id, user.id);
  }
}

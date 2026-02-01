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
import { StorageUsagesService } from './storage-usages.service';
import { CreateStorageUsageDto } from '../dto/create-storage-usage.dto';
import { FilterStorageUsagesDto } from '../dto/filter-storage-usages.dto';
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

@ApiTags('storage-usages')
@Controller('storage/usages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StorageUsagesController {
  constructor(private readonly storageUsagesService: StorageUsagesService) {}

  @ApiOperation({
    summary: 'Get all storage usages (stock-out records)',
    description: `
      Retrieve a list of stock usage records.

      **Available Filters:**
      - storage_item_id: Filter by storage item
      - reason: Filter by usage reason (production, waste, adjustment, expired)
      - start_date: Filter usages after this date
      - end_date: Filter usages before this date
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of storage usages',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @Get()
  findAll(@Query() query: FilterStorageUsagesDto) {
    return this.storageUsagesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get storage usage by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns storage usage details',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage usage not found',
    type: NotFoundResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storageUsagesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create new storage usage - consume stock (Manager/Admin/Kitchen)',
    description: `
      Record a new stock usage (consuming inventory).
      This will automatically decrease the current_quantity of the storage item.

      **Fields:**
      - storage_item_id: ID of the storage item (required)
      - quantity: Amount used (required, must be > 0, cannot exceed available quantity)
      - reason: Reason for usage - production, waste, adjustment, expired (optional)
      - notes: Additional notes (optional)
      - usage_date: When stock was used (optional, defaults to now)

      **Validation:**
      - Cannot use more than the available quantity (prevents negative stock)
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Storage usage created and quantity decreased',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or insufficient quantity',
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
  create(@Body() createDto: CreateStorageUsageDto, @CurrentUser() user: User) {
    return this.storageUsagesService.create(createDto, user.id);
  }

  @ApiOperation({
    summary: 'Delete storage usage - restore stock (Manager/Admin only)',
    description: `
      Soft delete a storage usage.
      This will automatically increase the current_quantity of the storage item (restore stock).
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Storage usage deleted and quantity restored',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage usage not found',
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
    return this.storageUsagesService.remove(id, user.id);
  }
}

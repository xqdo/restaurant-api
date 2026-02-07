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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { FilterVendorsDto } from './dto/filter-vendors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  BadRequestResponseDto,
} from '../common/dto/error-response.dto';

@ApiTags('vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @ApiOperation({
    summary: 'Get all vendors with optional filters',
    description: `
      Retrieve a list of vendors/suppliers.

      **Available Filters:**
      - search: Search by vendor name
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of vendors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @Get()
  findAll(@Query() query: FilterVendorsDto) {
    return this.vendorsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns vendor details',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
    type: NotFoundResponseDto,
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create new vendor (Manager/Admin only)',
    description: `
      Add a new vendor/supplier.

      **Fields:**
      - name: Vendor name (required)
      - phone: Phone number (optional)
      - address: Address (optional)
      - notes: Additional notes (optional)
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Vendor created successfully',
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
  create(@Body() createDto: CreateVendorDto, @CurrentUser() user: User) {
    return this.vendorsService.create(createDto, user.id);
  }

  @ApiOperation({ summary: 'Update vendor (Manager/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
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
    @Body() updateDto: UpdateVendorDto,
    @CurrentUser() user: User,
  ) {
    return this.vendorsService.update(id, updateDto, user.id);
  }

  @ApiOperation({ summary: 'Soft delete vendor (Manager/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Vendor deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
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
    return this.vendorsService.remove(id, user.id);
  }
}

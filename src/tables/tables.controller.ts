import {
  Controller,
  Get,
  Post,
  Patch,
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
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { FilterTablesDto } from './dto/filter-tables.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('tables')
@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @ApiOperation({ summary: 'Get all tables with optional status filter' })
  @ApiResponse({
    status: 200,
    description: 'Returns all non-deleted tables',
  })
  @ApiBearerAuth()
  @Get()
  findAll(@Query() query: FilterTablesDto) {
    return this.tablesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get only available tables' })
  @ApiResponse({
    status: 200,
    description: 'Returns only tables with AVAILABLE status',
  })
  @ApiBearerAuth()
  @Get('available')
  findAvailable() {
    return this.tablesService.findAvailable();
  }

  @ApiOperation({ summary: 'Get table by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns table details',
  })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new table (Manager/Admin only)' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Table number already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Post()
  create(@Body() createTableDto: CreateTableDto, @CurrentUser() user: User) {
    return this.tablesService.create(createTableDto, user.id);
  }

  @ApiOperation({ summary: 'Update table status' })
  @ApiResponse({ status: 200, description: 'Table status updated successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiBearerAuth()
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTableStatusDto: UpdateTableStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.tablesService.updateStatus(id, updateTableStatusDto, user.id);
  }

  @ApiOperation({ summary: 'Soft delete table (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Table deleted successfully' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.tablesService.remove(id, user.id);
  }
}

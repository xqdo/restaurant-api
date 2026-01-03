import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('menu-sections')
@Controller('menu/sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @ApiOperation({ summary: 'Get all menu sections' })
  @ApiResponse({
    status: 200,
    description: 'Returns all non-deleted sections',
  })
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.sectionsService.findAll();
  }

  @ApiOperation({ summary: 'Get section by ID with items' })
  @ApiResponse({
    status: 200,
    description: 'Returns section details with items',
  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sectionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new menu section (Manager/Admin only)' })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Post()
  create(
    @Body() createSectionDto: CreateSectionDto,
    @CurrentUser() user: User,
  ) {
    return this.sectionsService.create(createSectionDto, user.id);
  }

  @ApiOperation({ summary: 'Update section (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectionDto: UpdateSectionDto,
    @CurrentUser() user: User,
  ) {
    return this.sectionsService.update(id, updateSectionDto, user.id);
  }

  @ApiOperation({ summary: 'Soft delete section (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Section deleted successfully' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.sectionsService.remove(id, user.id);
  }
}

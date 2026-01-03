import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { FilterTablesDto } from './dto/filter-tables.dto';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Find all tables with optional status filter
   */
  async findAll(query?: FilterTablesDto) {
    this.logger.debug(`Finding tables with filter: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: {
        isdeleted: false,
      },
    };

    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.table.findMany({
      where,
      include: {
        baseEntity: true,
      },
      orderBy: {
        number: 'asc',
      },
    });
  }

  /**
   * Find only available tables
   */
  async findAvailable() {
    this.logger.debug('Finding available tables');

    return this.prisma.table.findMany({
      where: {
        status: TableStatus.AVAILABLE,
        baseEntity: {
          isdeleted: false,
        },
      },
      include: {
        baseEntity: true,
      },
      orderBy: {
        number: 'asc',
      },
    });
  }

  /**
   * Find one table by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding table with ID: ${id}`);

    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        baseEntity: true,
      },
    });

    if (!table || table.baseEntity.isdeleted) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  /**
   * Create table with duplicate number check
   */
  async create(createTableDto: CreateTableDto, userId: number) {
    this.logger.debug(`Creating table: ${createTableDto.number}`);

    // Check for duplicate table number
    const existing = await this.prisma.table.findFirst({
      where: {
        number: createTableDto.number,
        baseEntity: {
          isdeleted: false,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Table number ${createTableDto.number} already exists`,
      );
    }

    // Create base entity
    const baseEntity = await this.baseEntityService.create(userId);

    return this.prisma.table.create({
      data: {
        number: createTableDto.number,
        status: TableStatus.AVAILABLE,
        base_entity_id: baseEntity.id,
      },
      include: {
        baseEntity: true,
      },
    });
  }

  /**
   * Update table status
   */
  async updateStatus(
    id: number,
    updateTableStatusDto: UpdateTableStatusDto,
    userId: number,
  ) {
    this.logger.debug(`Updating table ${id} status to ${updateTableStatusDto.status}`);

    // Validate table exists
    const table = await this.findOne(id);

    // Update base entity audit trail
    await this.baseEntityService.update(table.base_entity_id, userId);

    return this.prisma.table.update({
      where: { id },
      data: {
        status: updateTableStatusDto.status,
      },
      include: {
        baseEntity: true,
      },
    });
  }

  /**
   * Soft delete table
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting table with ID: ${id}`);

    // Validate table exists
    const table = await this.findOne(id);

    // Soft delete via BaseEntityService
    await this.baseEntityService.softDelete(table.base_entity_id, userId);

    return { message: 'Table deleted successfully' };
  }
}

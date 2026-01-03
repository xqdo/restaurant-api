import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Find all non-deleted sections
   */
  async findAll() {
    this.logger.debug('Finding all sections');

    return this.prisma.section.findMany({
      where: {
        baseEntity: {
          isdeleted: false,
        },
      },
      include: {
        baseEntity: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find one section by ID with items
   */
  async findOne(id: number) {
    this.logger.debug(`Finding section with ID: ${id}`);

    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        baseEntity: true,
        items: {
          where: {
            baseEntity: {
              isdeleted: false,
            },
          },
          include: {
            image: true,
          },
        },
      },
    });

    if (!section || section.baseEntity.isdeleted) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  /**
   * Create new section with audit trail
   */
  async create(createSectionDto: CreateSectionDto, userId: number) {
    this.logger.debug(`Creating section: ${createSectionDto.name}`);

    // Create base entity for audit trail
    const baseEntity = await this.baseEntityService.create(userId);

    return this.prisma.section.create({
      data: {
        name: createSectionDto.name,
        base_entity_id: baseEntity.id,
      },
      include: {
        baseEntity: true,
      },
    });
  }

  /**
   * Update section with audit trail
   */
  async update(
    id: number,
    updateSectionDto: UpdateSectionDto,
    userId: number,
  ) {
    this.logger.debug(`Updating section with ID: ${id}`);

    // Validate section exists and is not deleted
    const section = await this.findOne(id);

    // Update base entity audit trail
    await this.baseEntityService.update(section.base_entity_id, userId);

    return this.prisma.section.update({
      where: { id },
      data: {
        name: updateSectionDto.name,
      },
      include: {
        baseEntity: true,
      },
    });
  }

  /**
   * Soft delete section
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting section with ID: ${id}`);

    // Validate section exists and is not deleted
    const section = await this.findOne(id);

    // Soft delete via BaseEntityService
    await this.baseEntityService.softDelete(section.base_entity_id, userId);

    return { message: 'Section deleted successfully' };
  }
}

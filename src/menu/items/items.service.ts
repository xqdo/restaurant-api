import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { ImagesService } from '../images/images.service';
import { PriceHistoryService } from '../price-history/price-history.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { FilterItemsDto } from '../dto/filter-items.dto';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
    private readonly imagesService: ImagesService,
    private readonly priceHistoryService: PriceHistoryService,
  ) {}

  /**
   * Find all items with optional filters
   */
  async findAll(query: FilterItemsDto) {
    this.logger.debug(`Finding items with filters: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: {
        isdeleted: false,
      },
    };

    // Filter by section
    if (query.section_id) {
      where.section_id = query.section_id;
    }

    // Search by name (case-insensitive)
    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    // Filter by price range
    if (query.min_price || query.max_price) {
      where.price = {};
      if (query.min_price) {
        where.price.gte = query.min_price;
      }
      if (query.max_price) {
        where.price.lte = query.max_price;
      }
    }

    return this.prisma.item.findMany({
      where,
      include: {
        section: true,
        image: true,
        baseEntity: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find one item by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding item with ID: ${id}`);

    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        section: true,
        image: true,
        baseEntity: true,
      },
    });

    if (!item || item.baseEntity.isdeleted) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Create new item with validation
   */
  async create(createItemDto: CreateItemDto, userId: number) {
    this.logger.debug(`Creating item: ${createItemDto.name}`);

    // Validate section exists
    const section = await this.prisma.section.findUnique({
      where: { id: createItemDto.section_id },
      include: { baseEntity: true },
    });

    if (!section || section.baseEntity.isdeleted) {
      throw new BadRequestException(
        `Section with ID ${createItemDto.section_id} not found`,
      );
    }

    // If image_id provided, validate it exists
    if (createItemDto.image_id) {
      const image = await this.prisma.image.findUnique({
        where: { id: createItemDto.image_id },
      });
      if (!image) {
        throw new BadRequestException(
          `Image with ID ${createItemDto.image_id} not found`,
        );
      }
    }

    // Create base entity
    const baseEntity = await this.baseEntityService.create(userId);

    const item = await this.prisma.item.create({
      data: {
        name: createItemDto.name,
        section_id: createItemDto.section_id,
        price: createItemDto.price,
        description: createItemDto.description,
        image_id: createItemDto.image_id,
        base_entity_id: baseEntity.id,
      },
      include: {
        section: true,
        image: true,
        baseEntity: true,
      },
    });

    // Initialize price history for the new item
    await this.priceHistoryService.initializePriceHistory(
      item.id,
      createItemDto.price,
      userId,
    );

    return item;
  }

  /**
   * Update item
   */
  async update(id: number, updateItemDto: UpdateItemDto, userId: number) {
    this.logger.debug(`Updating item with ID: ${id}`);

    // Validate item exists
    const item = await this.findOne(id);

    // Validate section if being updated
    if (updateItemDto.section_id) {
      const section = await this.prisma.section.findUnique({
        where: { id: updateItemDto.section_id },
        include: { baseEntity: true },
      });
      if (!section || section.baseEntity.isdeleted) {
        throw new BadRequestException(
          `Section with ID ${updateItemDto.section_id} not found`,
        );
      }
    }

    // Validate image if being updated
    if (updateItemDto.image_id) {
      const image = await this.prisma.image.findUnique({
        where: { id: updateItemDto.image_id },
      });
      if (!image) {
        throw new BadRequestException(
          `Image with ID ${updateItemDto.image_id} not found`,
        );
      }
    }

    // Check if price is being changed and record in history
    if (updateItemDto.price !== undefined) {
      const currentPrice = Number(item.price);
      const newPrice = updateItemDto.price;

      if (newPrice !== currentPrice) {
        this.logger.debug(`Price change detected for item ${id}: ${currentPrice} -> ${newPrice}`);
        await this.priceHistoryService.recordPriceChange(id, newPrice, userId);
      }
    }

    // Update base entity audit trail
    await this.baseEntityService.update(item.base_entity_id, userId);

    return this.prisma.item.update({
      where: { id },
      data: {
        name: updateItemDto.name,
        section_id: updateItemDto.section_id,
        price: updateItemDto.price,
        description: updateItemDto.description,
        image_id: updateItemDto.image_id,
      },
      include: {
        section: true,
        image: true,
        baseEntity: true,
      },
    });
  }

  /**
   * Upload image for item
   */
  async uploadImage(
    id: number,
    file: Express.Multer.File,
    userId: number,
  ) {
    this.logger.debug(`Uploading image for item ID: ${id}`);

    // Validate item exists
    const item = await this.findOne(id);

    // Create image record
    const image = await this.imagesService.create(file.path);

    // Update item with image_id
    await this.baseEntityService.update(item.base_entity_id, userId);

    return this.prisma.item.update({
      where: { id },
      data: {
        image_id: image.id,
      },
      include: {
        section: true,
        image: true,
        baseEntity: true,
      },
    });
  }

  /**
   * Soft delete item
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting item with ID: ${id}`);

    // Validate item exists
    const item = await this.findOne(id);

    // Soft delete via BaseEntityService
    await this.baseEntityService.softDelete(item.base_entity_id, userId);

    return { message: 'Item deleted successfully' };
  }
}

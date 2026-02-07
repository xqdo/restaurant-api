import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { FilterVendorsDto } from './dto/filter-vendors.dto';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baseEntityService: BaseEntityService,
  ) {}

  /**
   * Find all vendors with optional filters
   */
  async findAll(query: FilterVendorsDto) {
    this.logger.debug(`Finding vendors with filters: ${JSON.stringify(query)}`);

    const where: any = {
      baseEntity: {
        isdeleted: false,
      },
    };

    if (query.search) {
      where.name = {
        contains: query.search,
      };
    }

    return this.prisma.vendor.findMany({
      where,
      include: {
        baseEntity: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find one vendor by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding vendor with ID: ${id}`);

    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        baseEntity: true,
      },
    });

    if (!vendor || vendor.baseEntity.isdeleted) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  /**
   * Create new vendor
   */
  async create(createDto: CreateVendorDto, userId: number) {
    this.logger.debug(`Creating vendor: ${createDto.name}`);

    const baseEntity = await this.baseEntityService.create(userId);

    return this.prisma.vendor.create({
      data: {
        name: createDto.name,
        phone: createDto.phone,
        address: createDto.address,
        notes: createDto.notes,
        base_entity_id: baseEntity.id,
      },
      include: {
        baseEntity: true,
      },
    });
  }

  /**
   * Update vendor
   */
  async update(id: number, updateDto: UpdateVendorDto, userId: number) {
    this.logger.debug(`Updating vendor with ID: ${id}`);

    const vendor = await this.findOne(id);

    await this.baseEntityService.update(vendor.base_entity_id, userId);

    return this.prisma.vendor.update({
      where: { id },
      data: {
        name: updateDto.name,
        phone: updateDto.phone,
        address: updateDto.address,
        notes: updateDto.notes,
      },
      include: {
        baseEntity: true,
      },
    });
  }

  /**
   * Soft delete vendor
   */
  async remove(id: number, userId: number) {
    this.logger.debug(`Soft deleting vendor with ID: ${id}`);

    const vendor = await this.findOne(id);

    await this.baseEntityService.softDelete(vendor.base_entity_id, userId);

    return { message: 'Vendor deleted successfully' };
  }
}

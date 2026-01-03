import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create image record in database
   * @param path - File path relative to upload directory
   */
  async create(path: string) {
    this.logger.debug(`Creating image record for path: ${path}`);

    return this.prisma.image.create({
      data: { path },
    });
  }

  /**
   * Find image by ID
   */
  async findOne(id: number) {
    this.logger.debug(`Finding image with ID: ${id}`);

    const image = await this.prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    return image;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BaseEntityService {
  private readonly logger = new Logger(BaseEntityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new base entity record for audit trail
   * @param userId - The ID of the user creating the entity
   * @returns The created base entity with ID
   */
  async create(userId: number) {
    this.logger.debug(`Creating base entity for user ${userId}`);

    return this.prisma.baseEntity.create({
      data: {
        created_at: new Date(),
        created_by: userId,
        isdeleted: false,
      },
    });
  }

  /**
   * Update base entity timestamp and user
   * Note: Schema has typo 'upadated_at' - we'll use it as-is
   * @param baseEntityId - The ID of the base entity to update
   * @param userId - The ID of the user performing the update
   */
  async update(baseEntityId: number, userId: number) {
    this.logger.debug(
      `Updating base entity ${baseEntityId} by user ${userId}`,
    );

    return this.prisma.baseEntity.update({
      where: { id: baseEntityId },
      data: {
        updated_at: new Date(), // Maps to 'upadated_at' column (typo in schema)
        updated_by: userId,
      },
    });
  }

  /**
   * Soft delete an entity by marking it as deleted
   * @param baseEntityId - The ID of the base entity to soft delete
   * @param userId - The ID of the user performing the deletion
   */
  async softDelete(baseEntityId: number, userId: number) {
    this.logger.debug(
      `Soft deleting base entity ${baseEntityId} by user ${userId}`,
    );

    return this.prisma.baseEntity.update({
      where: { id: baseEntityId },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
        isdeleted: true,
      },
    });
  }

  /**
   * Check if a base entity is soft deleted
   * @param baseEntityId - The ID of the base entity to check
   * @returns true if deleted, false otherwise
   */
  async isDeleted(baseEntityId: number): Promise<boolean> {
    const entity = await this.prisma.baseEntity.findUnique({
      where: { id: baseEntityId },
      select: { isdeleted: true },
    });

    return entity?.isdeleted ?? false;
  }
}

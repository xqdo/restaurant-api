import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';
import { StorageItemsController } from './storage-items/storage-items.controller';
import { StorageItemsService } from './storage-items/storage-items.service';
import { StorageEntriesController } from './storage-entries/storage-entries.controller';
import { StorageEntriesService } from './storage-entries/storage-entries.service';
import { StorageUsagesController } from './storage-usages/storage-usages.controller';
import { StorageUsagesService } from './storage-usages/storage-usages.service';

@Module({
  imports: [PrismaModule, BaseEntityModule],
  controllers: [
    StorageItemsController,
    StorageEntriesController,
    StorageUsagesController,
  ],
  providers: [
    StorageItemsService,
    StorageEntriesService,
    StorageUsagesService,
  ],
  exports: [
    StorageItemsService,
    StorageEntriesService,
    StorageUsagesService,
  ],
})
export class StorageModule {}

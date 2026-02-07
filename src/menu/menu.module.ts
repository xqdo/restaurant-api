import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';
import { AuthModule } from '../auth/auth.module';
import { SectionsController } from './sections/sections.controller';
import { SectionsService } from './sections/sections.service';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { ImagesController } from './images/images.controller';
import { ImagesService } from './images/images.service';
import { PriceHistoryModule } from './price-history/price-history.module';
import { PriceHistoryService } from './price-history/price-history.service';

@Module({
  imports: [PrismaModule, BaseEntityModule, AuthModule, PriceHistoryModule],
  controllers: [SectionsController, ItemsController, ImagesController],
  providers: [SectionsService, ItemsService, ImagesService, PriceHistoryService],
  exports: [SectionsService, ItemsService, ImagesService, PriceHistoryService],
})
export class MenuModule {}

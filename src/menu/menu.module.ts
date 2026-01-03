import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';
import { AuthModule } from '../auth/auth.module';
import { SectionsController } from './sections/sections.controller';
import { SectionsService } from './sections/sections.service';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { ImagesService } from './images/images.service';

@Module({
  imports: [PrismaModule, BaseEntityModule, AuthModule],
  controllers: [SectionsController, ItemsController],
  providers: [SectionsService, ItemsService, ImagesService],
  exports: [SectionsService, ItemsService, ImagesService],
})
export class MenuModule {}

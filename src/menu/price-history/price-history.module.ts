import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BaseEntityModule } from '../../common/base-entity/base-entity.module';
import { PriceHistoryService } from './price-history.service';

@Module({
  imports: [PrismaModule, BaseEntityModule],
  providers: [PriceHistoryService],
  exports: [PriceHistoryService],
})
export class PriceHistoryModule {}

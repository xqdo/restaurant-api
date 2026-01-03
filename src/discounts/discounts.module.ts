import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountEngineService } from './discount-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';

@Module({
  imports: [PrismaModule, BaseEntityModule],
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountEngineService],
  exports: [DiscountsService, DiscountEngineService],
})
export class DiscountsModule {}

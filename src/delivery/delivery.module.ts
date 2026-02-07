import { Module, forwardRef } from '@nestjs/common';
import { DeliveryGuysController } from './delivery-guys/delivery-guys.controller';
import { DeliveryGuysService } from './delivery-guys/delivery-guys.service';
import { DeliveryReceiptsController } from './delivery-receipts/delivery-receipts.controller';
import { DeliveryReceiptsService } from './delivery-receipts/delivery-receipts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [
    PrismaModule,
    BaseEntityModule,
    forwardRef(() => ReceiptsModule),
  ],
  controllers: [DeliveryGuysController, DeliveryReceiptsController],
  providers: [DeliveryGuysService, DeliveryReceiptsService],
  exports: [DeliveryGuysService, DeliveryReceiptsService],
})
export class DeliveryModule {}

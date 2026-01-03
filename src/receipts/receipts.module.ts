import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { ReceiptItemsService } from './receipt-items/receipt-items.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';

@Module({
  imports: [PrismaModule, BaseEntityModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, ReceiptItemsService],
  exports: [ReceiptsService, ReceiptItemsService],
})
export class ReceiptsModule {}

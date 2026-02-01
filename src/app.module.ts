import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BaseEntityModule } from './common/base-entity/base-entity.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { TablesModule } from './tables/tables.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { DiscountsModule } from './discounts/discounts.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { ExportsModule } from './exports/exports.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    BaseEntityModule,
    AuthModule,
    MenuModule,
    TablesModule,
    ReceiptsModule,
    KitchenModule,
    DiscountsModule,
    DeliveryModule,
    ReportsModule,
    AuditModule,
    ExportsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BaseEntityModule } from './common/base-entity/base-entity.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { TablesModule } from './tables/tables.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { ExportsModule } from './exports/exports.module';
import { StorageModule } from './storage/storage.module';
import { AuditInterceptor } from './audit/interceptors/audit.interceptor';

@Module({
  imports: [
    PrismaModule,
    BaseEntityModule,
    AuthModule,
    MenuModule,
    TablesModule,
    ReceiptsModule,
    KitchenModule,
    DeliveryModule,
    ReportsModule,
    AuditModule,
    ExportsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

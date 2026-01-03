import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BaseEntityModule } from '../common/base-entity/base-entity.module';
import { AuthModule } from '../auth/auth.module';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

@Module({
  imports: [PrismaModule, BaseEntityModule, AuthModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}

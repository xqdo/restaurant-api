import { Global, Module } from '@nestjs/common';
import { BaseEntityService } from './base-entity.service';

@Global()
@Module({
  providers: [BaseEntityService],
  exports: [BaseEntityService],
})
export class BaseEntityModule {}

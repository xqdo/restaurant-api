import { PartialType } from '@nestjs/swagger';
import { CreateStorageItemDto } from './create-storage-item.dto';

export class UpdateStorageItemDto extends PartialType(CreateStorageItemDto) {}

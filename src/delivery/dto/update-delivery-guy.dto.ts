import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryGuyDto } from './create-delivery-guy.dto';

export class UpdateDeliveryGuyDto extends PartialType(CreateDeliveryGuyDto) {}

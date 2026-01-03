import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TableStatus } from '@prisma/client';

export class UpdateTableStatusDto {
  @ApiProperty({
    description: 'New status for the table',
    enum: TableStatus,
    example: TableStatus.OCCUPIED,
    examples: {
      available: {
        value: 'AVAILABLE',
        description: 'Table is free and ready for new customers',
      },
      occupied: {
        value: 'OCCUPIED',
        description: 'Table is currently being used by customers',
      },
      reserved: {
        value: 'RESERVED',
        description: 'Table is reserved for upcoming customers',
      },
    },
  })
  @IsEnum(TableStatus, {
    message: 'Status must be one of: AVAILABLE, OCCUPIED, RESERVED',
  })
  status: TableStatus;
}

import { ApiProperty } from '@nestjs/swagger';

export class SectionItemDto {
  @ApiProperty({ example: 15 })
  id: number;

  @ApiProperty({ example: 'Grilled Salmon' })
  name: string;

  @ApiProperty({ example: 24.99 })
  price: number;

  @ApiProperty({ example: 'Fresh Atlantic salmon grilled to perfection' })
  description: string;

  @ApiProperty({ example: '/uploads/menu-items/salmon.jpg', required: false })
  image_path?: string;
}

export class SectionWithItemsResponseDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Main Courses' })
  name: string;

  @ApiProperty({
    type: [SectionItemDto],
    description: 'Items in this section',
  })
  items: SectionItemDto[];

  @ApiProperty({ example: 12, description: 'Number of items in section' })
  items_count: number;

  @ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
  created_at: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MenuSectionDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Main Courses' })
  name: string;
}

export class MenuItemImageDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '/uploads/menu-items/item-1703847281234-987654321.jpg' })
  path: string;
}

export class MenuItemResponseDto {
  @ApiProperty({ example: 15 })
  id: number;

  @ApiProperty({ example: 'Grilled Salmon' })
  name: string;

  @ApiProperty({ example: 24.99 })
  price: number;

  @ApiProperty({ example: 'Fresh Atlantic salmon grilled to perfection, served with roasted vegetables and lemon butter sauce' })
  description: string;

  @ApiProperty({ type: MenuSectionDto })
  section: MenuSectionDto;

  @ApiPropertyOptional({ type: MenuItemImageDto })
  image?: MenuItemImageDto;

  @ApiProperty({ example: false })
  isdeleted: boolean;

  @ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
  created_at: string;
}

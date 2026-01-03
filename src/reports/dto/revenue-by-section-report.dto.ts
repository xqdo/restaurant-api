import { ApiProperty } from '@nestjs/swagger';

export class RevenueBySectionDto {
  @ApiProperty({ example: 1 })
  section_id: number;

  @ApiProperty({ example: 'Appetizers' })
  section_name: string;

  @ApiProperty({ example: 15, description: 'Number of items sold in this section' })
  items_count: number;

  @ApiProperty({ example: 125.5, description: 'Total quantity sold' })
  total_quantity: number;

  @ApiProperty({ example: 1850.75, description: 'Total revenue from this section' })
  total_revenue: number;

  @ApiProperty({ example: 35.5, description: 'Percentage of total revenue' })
  revenue_percentage: number;
}

export class RevenueBySectionReportDto {
  @ApiProperty({ type: [RevenueBySectionDto] })
  sections: RevenueBySectionDto[];

  @ApiProperty({ example: 5215.50, description: 'Total revenue across all sections' })
  total_revenue: number;

  @ApiProperty({ example: '7days' })
  period?: string;

  @ApiProperty({ example: '2025-01-01' })
  start_date?: string;

  @ApiProperty({ example: '2025-01-31' })
  end_date?: string;
}

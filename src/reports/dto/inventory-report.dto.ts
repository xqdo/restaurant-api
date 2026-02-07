import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- Inventory Status Report ---

export class InventoryStatusItemDto {
  @ApiProperty({ example: 1 })
  item_id: number;

  @ApiProperty({ example: 'دجاج' })
  name: string;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 25.5 })
  current_quantity: number;

  @ApiPropertyOptional({ example: 10 })
  min_quantity?: number | null;

  @ApiProperty({ example: 'ok', enum: ['ok', 'low', 'out'] })
  status: 'ok' | 'low' | 'out';

  @ApiPropertyOptional({ example: 'شركة الأغذية' })
  vendor_name?: string | null;
}

export class InventoryStatusReportDto {
  @ApiProperty({ type: [InventoryStatusItemDto] })
  items: InventoryStatusItemDto[];

  @ApiProperty({ example: 20 })
  total_items: number;

  @ApiProperty({ example: 3 })
  low_stock_count: number;

  @ApiProperty({ example: 1 })
  out_of_stock_count: number;
}

// --- Stock Movement Report ---

export class StockMovementItemDto {
  @ApiProperty({ example: 1 })
  item_id: number;

  @ApiProperty({ example: 'دجاج' })
  name: string;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 50 })
  total_entries_qty: number;

  @ApiProperty({ example: 5 })
  entries_count: number;

  @ApiProperty({ example: 30 })
  total_usages_qty: number;

  @ApiProperty({ example: 8 })
  usages_count: number;

  @ApiProperty({ example: 20, description: 'entries - usages' })
  net_change: number;
}

export class StockMovementReportDto {
  @ApiProperty({ type: [StockMovementItemDto] })
  items: StockMovementItemDto[];

  @ApiProperty({ example: 500 })
  total_received: number;

  @ApiProperty({ example: 300 })
  total_consumed: number;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;
}

// --- Purchase Cost Report ---

export class PurchaseCostItemDto {
  @ApiProperty({ example: 1 })
  item_id: number;

  @ApiProperty({ example: 'دجاج' })
  name: string;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 100 })
  total_quantity: number;

  @ApiProperty({ example: 500000 })
  total_cost: number;

  @ApiProperty({ example: 5000 })
  average_unit_cost: number;

  @ApiProperty({ example: 4 })
  entries_count: number;
}

export class PurchaseCostReportDto {
  @ApiProperty({ type: [PurchaseCostItemDto] })
  items: PurchaseCostItemDto[];

  @ApiProperty({ example: 2500000 })
  grand_total: number;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;
}

// --- Waste Report ---

export class WasteReportItemDto {
  @ApiProperty({ example: 1 })
  item_id: number;

  @ApiProperty({ example: 'دجاج' })
  name: string;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 5 })
  waste_qty: number;

  @ApiProperty({ example: 2 })
  waste_count: number;

  @ApiProperty({ example: 3 })
  expired_qty: number;

  @ApiProperty({ example: 1 })
  expired_count: number;

  @ApiProperty({ example: 8, description: 'waste + expired' })
  total_loss: number;
}

export class WasteReportDto {
  @ApiProperty({ type: [WasteReportItemDto] })
  items: WasteReportItemDto[];

  @ApiProperty({ example: 25 })
  total_waste_qty: number;

  @ApiProperty({ example: 10 })
  total_expired_qty: number;

  @ApiProperty({ example: 35 })
  total_loss: number;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;
}

// --- Vendor Performance Report ---

export class VendorPerformanceItemDto {
  @ApiProperty({ example: 1 })
  vendor_id: number;

  @ApiProperty({ example: 'شركة الأغذية' })
  name: string;

  @ApiPropertyOptional({ example: '07701234567' })
  phone?: string | null;

  @ApiProperty({ example: 200 })
  total_quantity: number;

  @ApiProperty({ example: 1500000 })
  total_cost: number;

  @ApiProperty({ example: 5 })
  unique_items_count: number;

  @ApiProperty({ example: 8 })
  entries_count: number;

  @ApiProperty({ example: 187500 })
  average_cost_per_entry: number;
}

export class VendorPerformanceReportDto {
  @ApiProperty({ type: [VendorPerformanceItemDto] })
  vendors: VendorPerformanceItemDto[];

  @ApiProperty({ example: 5000000 })
  grand_total: number;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;
}

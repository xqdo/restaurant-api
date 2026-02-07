import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import {
  SalesReportDto,
  PeriodSalesReportDto,
} from './dto/sales-report.dto';
import { TopItemsReportDto, TopItemsQueryDto } from './dto/top-items-report.dto';
import { DiscountUsageReportDto } from './dto/discount-usage-report.dto';
import { StaffPerformanceReportDto } from './dto/staff-performance-report.dto';
import { TableTurnoverReportDto } from './dto/table-turnover-report.dto';
import { RevenueBySectionReportDto } from './dto/revenue-by-section-report.dto';
import {
  InventoryStatusReportDto,
  StockMovementReportDto,
  PurchaseCostReportDto,
  WasteReportDto,
  VendorPerformanceReportDto,
} from './dto/inventory-report.dto';
import { DateRangeDto } from './dto/date-range.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get daily sales report for a specific date
   */
  async getDailySales(date: string): Promise<SalesReportDto> {
    this.logger.debug(`Generating daily sales report for ${date}`);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all receipts for the day
    const receipts = await this.prisma.receipt.findMany({
      where: {
        baseEntity: {
          created_at: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isdeleted: false,
        },
      },
      include: {
        receiptItems: {
          include: {
            item: true,
          },
        },
      },
    });

    const totalReceipts = receipts.length;
    let totalRevenue = 0;
    let dineInOrders = 0;
    let deliveryOrders = 0;

    receipts.forEach((receipt) => {
      // Count dine-in vs delivery
      if (receipt.is_delivery) {
        deliveryOrders++;
      } else {
        dineInOrders++;
      }

      // Calculate revenue for this receipt
      let receiptRevenue = 0;
      receipt.receiptItems.forEach((item) => {
        // Use unit_price (price at time of sale) if available, fallback to item.price
        const itemTotal =
          this.getItemPrice(item) *
          parseFloat(item.quantity.toString());

        receiptRevenue += itemTotal;
      });

      // Subtract quick discount if any
      if (receipt.quick_discount) {
        receiptRevenue -= parseFloat(receipt.quick_discount.toString());
      }

      totalRevenue += receiptRevenue;
    });

    const averageOrderValue = totalReceipts > 0 ? totalRevenue / totalReceipts : 0;

    return {
      date,
      total_receipts: totalReceipts,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      dine_in_orders: dineInOrders,
      delivery_orders: deliveryOrders,
    };
  }

  /**
   * Get sales report for a period (date range)
   */
  async getPeriodSales(dto: DateRangeDto): Promise<PeriodSalesReportDto> {
    const { start, end, period } = this.calculateDateRange(dto);

    this.logger.debug(`Generating period sales report from ${start} to ${end}`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const receipts = await this.prisma.receipt.findMany({
      where: {
        baseEntity: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          isdeleted: false,
        },
      },
      include: {
        receiptItems: {
          include: {
            item: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let dineInOrders = 0;
    let deliveryOrders = 0;

    receipts.forEach((receipt) => {
      if (receipt.is_delivery) {
        deliveryOrders++;
      } else {
        dineInOrders++;
      }

      let receiptRevenue = 0;
      receipt.receiptItems.forEach((item) => {
        // Use unit_price (price at time of sale) if available, fallback to item.price
        const itemTotal =
          this.getItemPrice(item) *
          parseFloat(item.quantity.toString());
        receiptRevenue += itemTotal;
      });

      // Subtract quick discount if any
      if (receipt.quick_discount) {
        receiptRevenue -= parseFloat(receipt.quick_discount.toString());
      }

      totalRevenue += receiptRevenue;
    });

    const averageOrderValue =
      receipts.length > 0 ? totalRevenue / receipts.length : 0;

    return {
      start_date: start,
      end_date: end,
      total_receipts: receipts.length,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      dine_in_orders: dineInOrders,
      delivery_orders: deliveryOrders,
    };
  }

  /**
   * Get top selling items report
   */
  async getTopSellingItems(dto: TopItemsQueryDto): Promise<TopItemsReportDto> {
    const { start, end, period } = this.calculateDateRange({
      period: dto.period || '7days',
    });

    this.logger.debug(`Generating top selling items report for period ${period}`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Query receipt items with aggregation
    const receiptItems = await this.prisma.receiptItem.findMany({
      where: {
        baseEntity: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          isdeleted: false,
        },
      },
      include: {
        item: true,
      },
    });

    // Aggregate by item
    const itemsMap = new Map<number, { item: any; quantity: number; revenue: number }>();

    receiptItems.forEach((ri) => {
      const existing = itemsMap.get(ri.item_id);
      const quantity = parseFloat(ri.quantity.toString());
      // Use unit_price (price at time of sale) if available, fallback to item.price
      const revenue = this.getItemPrice(ri) * quantity;

      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
      } else {
        itemsMap.set(ri.item_id, {
          item: ri.item,
          quantity,
          revenue,
        });
      }
    });

    // Convert to array and sort by quantity
    const topItems = Array.from(itemsMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, dto.limit || 10)
      .map((item) => ({
        item_id: item.item.id,
        name: item.item.name,
        quantity_sold: parseFloat(item.quantity.toFixed(2)),
        revenue: parseFloat(item.revenue.toFixed(2)),
        price: parseFloat(item.item.price.toString()),
      }));

    return {
      period: period || `${start} to ${end}`,
      items: topItems,
    };
  }

  /**
   * Get revenue breakdown by section
   */
  async getRevenueBySection(dto: DateRangeDto): Promise<RevenueBySectionReportDto> {
    const { start, end, period } = this.calculateDateRange(dto);

    this.logger.debug(`Generating revenue by section report`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const receiptItems = await this.prisma.receiptItem.findMany({
      where: {
        baseEntity: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          isdeleted: false,
        },
      },
      include: {
        item: {
          include: {
            section: true,
          },
        },
      },
    });

    // Aggregate by section
    const sectionsMap = new Map<
      number,
      { section: any; quantity: number; revenue: number; itemsCount: number }
    >();

    receiptItems.forEach((ri) => {
      const sectionId = ri.item.section_id;
      const existing = sectionsMap.get(sectionId);
      const quantity = parseFloat(ri.quantity.toString());
      // Use unit_price (price at time of sale) if available, fallback to item.price
      const revenue = this.getItemPrice(ri) * quantity;

      if (existing) {
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.itemsCount++;
      } else {
        sectionsMap.set(sectionId, {
          section: ri.item.section,
          quantity,
          revenue,
          itemsCount: 1,
        });
      }
    });

    const totalRevenue = Array.from(sectionsMap.values()).reduce(
      (sum, s) => sum + s.revenue,
      0,
    );

    const sections = Array.from(sectionsMap.values())
      .map((s) => ({
        section_id: s.section.id,
        section_name: s.section.name,
        items_count: s.itemsCount,
        total_quantity: parseFloat(s.quantity.toFixed(2)),
        total_revenue: parseFloat(s.revenue.toFixed(2)),
        revenue_percentage: parseFloat(
          ((s.revenue / totalRevenue) * 100).toFixed(2),
        ),
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);

    return {
      sections,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      period,
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get staff performance report
   */
  async getStaffPerformance(dto: DateRangeDto): Promise<StaffPerformanceReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Generating staff performance report`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const receipts = await this.prisma.receipt.findMany({
      where: {
        baseEntity: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          isdeleted: false,
        },
      },
      include: {
        baseEntity: {
          include: {
            createdByUser: {
              include: {
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        receiptItems: {
          include: {
            item: true,
          },
        },
      },
    });

    // Aggregate by user
    const staffMap = new Map<
      number,
      { user: any; ordersCount: number; totalRevenue: number }
    >();

    receipts.forEach((receipt) => {
      const userId = receipt.baseEntity.created_by;
      if (!userId) return;

      let receiptRevenue = 0;
      receipt.receiptItems.forEach((item) => {
        // Use unit_price (price at time of sale) if available, fallback to item.price
        const itemTotal =
          this.getItemPrice(item) *
          parseFloat(item.quantity.toString());
        receiptRevenue += itemTotal;
      });

      // Subtract quick discount if any
      if (receipt.quick_discount) {
        receiptRevenue -= parseFloat(receipt.quick_discount.toString());
      }

      const existing = staffMap.get(userId);
      if (existing) {
        existing.ordersCount++;
        existing.totalRevenue += receiptRevenue;
      } else {
        staffMap.set(userId, {
          user: receipt.baseEntity.createdByUser,
          ordersCount: 1,
          totalRevenue: receiptRevenue,
        });
      }
    });

    const staff = Array.from(staffMap.values())
      .map((s) => ({
        user_id: s.user.id,
        fullname: s.user.fullname,
        orders_count: s.ordersCount,
        total_revenue: parseFloat(s.totalRevenue.toFixed(2)),
        average_order_value: parseFloat(
          (s.totalRevenue / s.ordersCount).toFixed(2),
        ),
        roles: s.user.userRoles.map((ur) => ur.role.name),
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);

    return {
      staff,
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get table turnover report
   */
  async getTableTurnover(dto: DateRangeDto): Promise<TableTurnoverReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Generating table turnover report`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const receipts = await this.prisma.receipt.findMany({
      where: {
        table_id: { not: null },
        baseEntity: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          isdeleted: false,
        },
      },
      include: {
        table: true,
        receiptItems: {
          include: {
            item: true,
          },
        },
      },
    });

    // Aggregate by table
    const tablesMap = new Map<
      number,
      { table: any; ordersCount: number; totalRevenue: number }
    >();

    receipts.forEach((receipt) => {
      if (!receipt.table_id) return;

      let receiptRevenue = 0;
      receipt.receiptItems.forEach((item) => {
        // Use unit_price (price at time of sale) if available, fallback to item.price
        const itemTotal =
          this.getItemPrice(item) *
          parseFloat(item.quantity.toString());
        receiptRevenue += itemTotal;
      });

      // Subtract quick discount if any
      if (receipt.quick_discount) {
        receiptRevenue -= parseFloat(receipt.quick_discount.toString());
      }

      const existing = tablesMap.get(receipt.table_id);
      if (existing) {
        existing.ordersCount++;
        existing.totalRevenue += receiptRevenue;
      } else {
        tablesMap.set(receipt.table_id, {
          table: receipt.table,
          ordersCount: 1,
          totalRevenue: receiptRevenue,
        });
      }
    });

    const tables = Array.from(tablesMap.values())
      .map((t) => ({
        table_id: t.table.id,
        table_number: t.table.number,
        orders_count: t.ordersCount,
        total_revenue: parseFloat(t.totalRevenue.toFixed(2)),
        average_order_value: parseFloat(
          (t.totalRevenue / t.ordersCount).toFixed(2),
        ),
        current_status: t.table.status,
      }))
      .sort((a, b) => b.orders_count - a.orders_count);

    return {
      tables,
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get discount usage report
   */
  async getDiscountUsage(dto: DateRangeDto): Promise<DiscountUsageReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Discount system removed - returning empty report`);

    return {
      discounts: [],
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get current inventory status (snapshot, no date range)
   */
  async getInventoryStatus(): Promise<InventoryStatusReportDto> {
    this.logger.debug('Generating inventory status report');

    const storageItems = await this.prisma.storageItem.findMany({
      where: {
        baseEntity: { isdeleted: false },
      },
      include: {
        vendor: true,
      },
      orderBy: { name: 'asc' },
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;

    const items = storageItems.map((item) => {
      const currentQty = parseFloat(item.current_quantity.toString());
      const minQty = item.min_quantity
        ? parseFloat(item.min_quantity.toString())
        : null;

      let status: 'ok' | 'low' | 'out';
      if (currentQty === 0) {
        status = 'out';
        outOfStockCount++;
      } else if (minQty !== null && currentQty < minQty) {
        status = 'low';
        lowStockCount++;
      } else {
        status = 'ok';
      }

      return {
        item_id: item.id,
        name: item.name,
        unit: item.unit,
        current_quantity: currentQty,
        min_quantity: minQty,
        status,
        vendor_name: item.vendor?.name || null,
      };
    });

    return {
      items,
      total_items: items.length,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
    };
  }

  /**
   * Get stock movement report (entries and usages in date range)
   */
  async getStockMovement(dto: DateRangeDto): Promise<StockMovementReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Generating stock movement report from ${start} to ${end}`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const [entries, usages] = await Promise.all([
      this.prisma.storageEntry.findMany({
        where: {
          entry_date: { gte: startDate, lte: endDate },
          baseEntity: { isdeleted: false },
        },
        include: { storageItem: true },
      }),
      this.prisma.storageUsage.findMany({
        where: {
          usage_date: { gte: startDate, lte: endDate },
          baseEntity: { isdeleted: false },
        },
        include: { storageItem: true },
      }),
    ]);

    const itemsMap = new Map<
      number,
      {
        name: string;
        unit: string;
        entriesQty: number;
        entriesCount: number;
        usagesQty: number;
        usagesCount: number;
      }
    >();

    entries.forEach((e) => {
      const qty = parseFloat(e.quantity.toString());
      const existing = itemsMap.get(e.storage_item_id);
      if (existing) {
        existing.entriesQty += qty;
        existing.entriesCount++;
      } else {
        itemsMap.set(e.storage_item_id, {
          name: e.storageItem.name,
          unit: e.storageItem.unit,
          entriesQty: qty,
          entriesCount: 1,
          usagesQty: 0,
          usagesCount: 0,
        });
      }
    });

    usages.forEach((u) => {
      const qty = parseFloat(u.quantity.toString());
      const existing = itemsMap.get(u.storage_item_id);
      if (existing) {
        existing.usagesQty += qty;
        existing.usagesCount++;
      } else {
        itemsMap.set(u.storage_item_id, {
          name: u.storageItem.name,
          unit: u.storageItem.unit,
          entriesQty: 0,
          entriesCount: 0,
          usagesQty: qty,
          usagesCount: 1,
        });
      }
    });

    let totalReceived = 0;
    let totalConsumed = 0;

    const items = Array.from(itemsMap.entries())
      .map(([itemId, data]) => {
        const netChange = parseFloat(
          (data.entriesQty - data.usagesQty).toFixed(2),
        );
        totalReceived += data.entriesQty;
        totalConsumed += data.usagesQty;

        return {
          item_id: itemId,
          name: data.name,
          unit: data.unit,
          total_entries_qty: parseFloat(data.entriesQty.toFixed(2)),
          entries_count: data.entriesCount,
          total_usages_qty: parseFloat(data.usagesQty.toFixed(2)),
          usages_count: data.usagesCount,
          net_change: netChange,
        };
      })
      .sort((a, b) => Math.abs(b.net_change) - Math.abs(a.net_change));

    return {
      items,
      total_received: parseFloat(totalReceived.toFixed(2)),
      total_consumed: parseFloat(totalConsumed.toFixed(2)),
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get purchase cost report (entries cost aggregation)
   */
  async getPurchaseCost(dto: DateRangeDto): Promise<PurchaseCostReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Generating purchase cost report from ${start} to ${end}`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const entries = await this.prisma.storageEntry.findMany({
      where: {
        entry_date: { gte: startDate, lte: endDate },
        baseEntity: { isdeleted: false },
      },
      include: { storageItem: true },
    });

    const itemsMap = new Map<
      number,
      {
        name: string;
        unit: string;
        totalQty: number;
        totalCost: number;
        count: number;
      }
    >();

    entries.forEach((e) => {
      const qty = parseFloat(e.quantity.toString());
      const unitPrice = e.unit_price
        ? parseFloat(e.unit_price.toString())
        : 0;
      const cost = qty * unitPrice;

      const existing = itemsMap.get(e.storage_item_id);
      if (existing) {
        existing.totalQty += qty;
        existing.totalCost += cost;
        existing.count++;
      } else {
        itemsMap.set(e.storage_item_id, {
          name: e.storageItem.name,
          unit: e.storageItem.unit,
          totalQty: qty,
          totalCost: cost,
          count: 1,
        });
      }
    });

    let grandTotal = 0;

    const items = Array.from(itemsMap.entries())
      .map(([itemId, data]) => {
        grandTotal += data.totalCost;
        const avgCost =
          data.totalQty > 0 ? data.totalCost / data.totalQty : 0;

        return {
          item_id: itemId,
          name: data.name,
          unit: data.unit,
          total_quantity: parseFloat(data.totalQty.toFixed(2)),
          total_cost: parseFloat(data.totalCost.toFixed(2)),
          average_unit_cost: parseFloat(avgCost.toFixed(2)),
          entries_count: data.count,
        };
      })
      .sort((a, b) => b.total_cost - a.total_cost);

    return {
      items,
      grand_total: parseFloat(grandTotal.toFixed(2)),
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get waste and expired report
   */
  async getWasteReport(dto: DateRangeDto): Promise<WasteReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Generating waste report from ${start} to ${end}`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const usages = await this.prisma.storageUsage.findMany({
      where: {
        usage_date: { gte: startDate, lte: endDate },
        reason: { in: ['waste', 'expired'] },
        baseEntity: { isdeleted: false },
      },
      include: { storageItem: true },
    });

    const itemsMap = new Map<
      number,
      {
        name: string;
        unit: string;
        wasteQty: number;
        wasteCount: number;
        expiredQty: number;
        expiredCount: number;
      }
    >();

    usages.forEach((u) => {
      const qty = parseFloat(u.quantity.toString());
      const existing = itemsMap.get(u.storage_item_id);

      if (existing) {
        if (u.reason === 'waste') {
          existing.wasteQty += qty;
          existing.wasteCount++;
        } else {
          existing.expiredQty += qty;
          existing.expiredCount++;
        }
      } else {
        itemsMap.set(u.storage_item_id, {
          name: u.storageItem.name,
          unit: u.storageItem.unit,
          wasteQty: u.reason === 'waste' ? qty : 0,
          wasteCount: u.reason === 'waste' ? 1 : 0,
          expiredQty: u.reason === 'expired' ? qty : 0,
          expiredCount: u.reason === 'expired' ? 1 : 0,
        });
      }
    });

    let totalWasteQty = 0;
    let totalExpiredQty = 0;

    const items = Array.from(itemsMap.entries())
      .map(([itemId, data]) => {
        const totalLoss = data.wasteQty + data.expiredQty;
        totalWasteQty += data.wasteQty;
        totalExpiredQty += data.expiredQty;

        return {
          item_id: itemId,
          name: data.name,
          unit: data.unit,
          waste_qty: parseFloat(data.wasteQty.toFixed(2)),
          waste_count: data.wasteCount,
          expired_qty: parseFloat(data.expiredQty.toFixed(2)),
          expired_count: data.expiredCount,
          total_loss: parseFloat(totalLoss.toFixed(2)),
        };
      })
      .sort((a, b) => b.total_loss - a.total_loss);

    return {
      items,
      total_waste_qty: parseFloat(totalWasteQty.toFixed(2)),
      total_expired_qty: parseFloat(totalExpiredQty.toFixed(2)),
      total_loss: parseFloat((totalWasteQty + totalExpiredQty).toFixed(2)),
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Get vendor performance report
   */
  async getVendorPerformance(
    dto: DateRangeDto,
  ): Promise<VendorPerformanceReportDto> {
    const { start, end } = this.calculateDateRange(dto);

    this.logger.debug(`Generating vendor performance report from ${start} to ${end}`);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const entries = await this.prisma.storageEntry.findMany({
      where: {
        vendor_id: { not: null },
        entry_date: { gte: startDate, lte: endDate },
        baseEntity: { isdeleted: false },
      },
      include: {
        vendor: true,
        storageItem: true,
      },
    });

    const vendorsMap = new Map<
      number,
      {
        name: string;
        phone: string | null;
        totalQty: number;
        totalCost: number;
        uniqueItems: Set<number>;
        count: number;
      }
    >();

    entries.forEach((e) => {
      if (!e.vendor_id || !e.vendor) return;

      const qty = parseFloat(e.quantity.toString());
      const unitPrice = e.unit_price
        ? parseFloat(e.unit_price.toString())
        : 0;
      const cost = qty * unitPrice;

      const existing = vendorsMap.get(e.vendor_id);
      if (existing) {
        existing.totalQty += qty;
        existing.totalCost += cost;
        existing.uniqueItems.add(e.storage_item_id);
        existing.count++;
      } else {
        vendorsMap.set(e.vendor_id, {
          name: e.vendor.name,
          phone: e.vendor.phone,
          totalQty: qty,
          totalCost: cost,
          uniqueItems: new Set([e.storage_item_id]),
          count: 1,
        });
      }
    });

    let grandTotal = 0;

    const vendors = Array.from(vendorsMap.entries())
      .map(([vendorId, data]) => {
        grandTotal += data.totalCost;
        const avgCostPerEntry =
          data.count > 0 ? data.totalCost / data.count : 0;

        return {
          vendor_id: vendorId,
          name: data.name,
          phone: data.phone,
          total_quantity: parseFloat(data.totalQty.toFixed(2)),
          total_cost: parseFloat(data.totalCost.toFixed(2)),
          unique_items_count: data.uniqueItems.size,
          entries_count: data.count,
          average_cost_per_entry: parseFloat(avgCostPerEntry.toFixed(2)),
        };
      })
      .sort((a, b) => b.total_cost - a.total_cost);

    return {
      vendors,
      grand_total: parseFloat(grandTotal.toFixed(2)),
      start_date: start,
      end_date: end,
    };
  }

  /**
   * Helper method to get item price (uses unit_price if available, falls back to item.price)
   * This ensures historical reports show correct prices at time of sale
   */
  private getItemPrice(receiptItem: any): number {
    if (receiptItem.unit_price) {
      return parseFloat(receiptItem.unit_price.toString());
    }
    return parseFloat(receiptItem.item.price.toString());
  }

  /**
   * Helper method to calculate date range from DTO
   */
  private calculateDateRange(dto: Partial<DateRangeDto>): {
    start: string;
    end: string;
    period?: string;
  } {
    if (dto.start && dto.end) {
      return { start: dto.start, end: dto.end };
    }

    const now = new Date();
    let start: Date;
    let period = dto.period || '7days';

    switch (period) {
      case '7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      period,
    };
  }
}

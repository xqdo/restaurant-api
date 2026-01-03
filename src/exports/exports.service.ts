import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createObjectCsvStringifier } from 'csv-writer';
import * as ExcelJS from 'exceljs';
import { ExportRequestDto } from './dto/export-request.dto';
import { CustomReportDto } from './dto/custom-report.dto';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export sales data to CSV
   */
  async exportSalesToCsv(dto: ExportRequestDto): Promise<Buffer> {
    this.logger.debug(`Exporting sales to CSV`);

    const { start, end } = this.calculateDateRange(dto);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Get receipts with all details
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
        baseEntity: true,
        table: true,
        receiptItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        baseEntity: {
          created_at: 'desc',
        },
      },
    });

    // Prepare CSV data
    const csvData = receipts.map((receipt) => {
      const itemsTotal = receipt.receiptItems.reduce((sum, ri) => {
        return sum + parseFloat(ri.item.price.toString()) * parseFloat(ri.quantity.toString());
      }, 0);

      const itemsList = receipt.receiptItems
        .map((ri) => `${ri.item.name} (${ri.quantity})`)
        .join('; ');

      return {
        receipt_number: receipt.number,
        date: receipt.baseEntity.created_at.toISOString().split('T')[0],
        time: receipt.baseEntity.created_at.toISOString().split('T')[1].split('.')[0],
        type: receipt.is_delivery ? 'Delivery' : 'Dine-in',
        table_number: receipt.table?.number || 'N/A',
        items: itemsList,
        total: itemsTotal.toFixed(2),
        phone: receipt.phone_number || '',
        location: receipt.location || '',
        notes: receipt.notes || '',
      };
    });

    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'receipt_number', title: 'Receipt Number' },
        { id: 'date', title: 'Date' },
        { id: 'time', title: 'Time' },
        { id: 'type', title: 'Order Type' },
        { id: 'table_number', title: 'Table' },
        { id: 'items', title: 'Items' },
        { id: 'total', title: 'Total' },
        { id: 'phone', title: 'Phone' },
        { id: 'location', title: 'Location' },
        { id: 'notes', title: 'Notes' },
      ],
    });

    const csvContent =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(csvData);

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Export receipts to Excel with multiple sheets
   */
  async exportReceiptsToExcel(dto: ExportRequestDto): Promise<Buffer> {
    this.logger.debug(`Exporting receipts to Excel`);

    const { start, end } = this.calculateDateRange(dto);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Get receipts with all details
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
        baseEntity: true,
        table: true,
        receiptItems: {
          include: {
            item: {
              include: {
                section: true,
              },
            },
          },
        },
        receiptDiscounts: {
          include: {
            discount: true,
          },
        },
      },
      orderBy: {
        baseEntity: {
          created_at: 'desc',
        },
      },
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Restaurant Management System';
    workbook.created = new Date();

    // Sheet 1: Sales Summary
    const summarySheet = workbook.addWorksheet('Sales Summary');
    summarySheet.columns = [
      { header: 'Receipt #', key: 'receipt_number', width: 12 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Table', key: 'table_number', width: 8 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Phone', key: 'phone', width: 15 },
    ];

    // Header styling
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    let totalRevenue = 0;

    receipts.forEach((receipt) => {
      const itemsTotal = receipt.receiptItems.reduce((sum, ri) => {
        return sum + parseFloat(ri.item.price.toString()) * parseFloat(ri.quantity.toString());
      }, 0);

      totalRevenue += itemsTotal;

      summarySheet.addRow({
        receipt_number: receipt.number,
        date: receipt.baseEntity.created_at.toISOString().split('T')[0],
        time: receipt.baseEntity.created_at.toISOString().split('T')[1].split('.')[0],
        type: receipt.is_delivery ? 'Delivery' : 'Dine-in',
        table_number: receipt.table?.number || 'N/A',
        total: itemsTotal.toFixed(2),
        phone: receipt.phone_number || '',
      });
    });

    // Add totals row
    const totalRow = summarySheet.addRow({
      receipt_number: 'TOTAL',
      total: totalRevenue.toFixed(2),
    });
    totalRow.font = { bold: true };

    // Sheet 2: Item Details
    const itemsSheet = workbook.addWorksheet('Item Details');
    itemsSheet.columns = [
      { header: 'Receipt #', key: 'receipt_number', width: 12 },
      { header: 'Item Name', key: 'item_name', width: 30 },
      { header: 'Section', key: 'section', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Subtotal', key: 'subtotal', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    itemsSheet.getRow(1).font = { bold: true };
    itemsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    receipts.forEach((receipt) => {
      receipt.receiptItems.forEach((ri) => {
        const quantity = parseFloat(ri.quantity.toString());
        const price = parseFloat(ri.item.price.toString());

        itemsSheet.addRow({
          receipt_number: receipt.number,
          item_name: ri.item.name,
          section: ri.item.section.name,
          quantity: quantity,
          price: price.toFixed(2),
          subtotal: (quantity * price).toFixed(2),
          status: ri.status,
        });
      });
    });

    // Sheet 3: Discounts Applied
    const discountsSheet = workbook.addWorksheet('Discounts Applied');
    discountsSheet.columns = [
      { header: 'Receipt #', key: 'receipt_number', width: 12 },
      { header: 'Discount Code', key: 'code', width: 15 },
      { header: 'Discount Name', key: 'name', width: 30 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Amount', key: 'amount', width: 12 },
    ];

    discountsSheet.getRow(1).font = { bold: true };
    discountsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    receipts.forEach((receipt) => {
      receipt.receiptDiscounts.forEach((rd) => {
        discountsSheet.addRow({
          receipt_number: receipt.number,
          code: rd.discount.code,
          name: rd.discount.name,
          type: rd.discount.type,
          amount: rd.discount.amount?.toString() || rd.discount.persentage?.toString() + '%' || 'N/A',
        });
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export items list to CSV
   */
  async exportItemsToCsv(): Promise<Buffer> {
    this.logger.debug(`Exporting items to CSV`);

    const items = await this.prisma.item.findMany({
      where: {
        baseEntity: {
          isdeleted: false,
        },
      },
      include: {
        section: true,
        image: true,
      },
      orderBy: {
        section_id: 'asc',
      },
    });

    const csvData = items.map((item) => ({
      id: item.id,
      name: item.name,
      section: item.section.name,
      price: parseFloat(item.price.toString()).toFixed(2),
      description: item.description || '',
      image: item.image?.path || '',
    }));

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Item Name' },
        { id: 'section', title: 'Section' },
        { id: 'price', title: 'Price' },
        { id: 'description', title: 'Description' },
        { id: 'image', title: 'Image Path' },
      ],
    });

    const csvContent =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(csvData);

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Generate custom report based on user specifications
   */
  async generateCustomReport(dto: CustomReportDto): Promise<Buffer> {
    this.logger.debug(`Generating custom report`);

    // This is a simplified implementation
    // In a real system, you'd dynamically build queries based on selected columns

    if (dto.format === 'excel') {
      return this.exportReceiptsToExcel({
        start: dto.start_date,
        end: dto.end_date,
      });
    } else {
      return this.exportSalesToCsv({
        start: dto.start_date,
        end: dto.end_date,
      });
    }
  }

  /**
   * Helper method to calculate date range
   */
  private calculateDateRange(dto: Partial<ExportRequestDto>): {
    start: string;
    end: string;
  } {
    if (dto.start && dto.end) {
      return { start: dto.start, end: dto.end };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      start: dto.start || thirtyDaysAgo.toISOString().split('T')[0],
      end: dto.end || now.toISOString().split('T')[0],
    };
  }
}

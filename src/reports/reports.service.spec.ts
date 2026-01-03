import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    receipt: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    receiptItem: {
      findMany: jest.fn(),
    },
    receiptDiscount: {
      findMany: jest.fn(),
    },
    receiptItemDiscount: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDailySales', () => {
    it('should return daily sales report with correct structure', async () => {
      const mockReceipts = [
        {
          id: 1,
          number: 1001,
          is_delivery: false,
          receiptItems: [
            {
              item: { price: 10.0 },
              quantity: 2,
              receiptItemDiscounts: [],
            },
          ],
          receiptDiscounts: [],
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
        {
          id: 2,
          number: 1002,
          is_delivery: true,
          receiptItems: [
            {
              item: { price: 15.0 },
              quantity: 1,
              receiptItemDiscounts: [],
            },
          ],
          receiptDiscounts: [],
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
      ];

      mockPrismaService.receipt.findMany.mockResolvedValue(mockReceipts);

      const result = await service.getDailySales('2025-12-28');

      expect(result).toHaveProperty('date', '2025-12-28');
      expect(result).toHaveProperty('total_receipts', 2);
      expect(result).toHaveProperty('total_revenue', 35.0);
      expect(result).toHaveProperty('average_order_value', 17.5);
      expect(result).toHaveProperty('dine_in_orders', 1);
      expect(result).toHaveProperty('delivery_orders', 1);
    });

    it('should handle empty receipts', async () => {
      mockPrismaService.receipt.findMany.mockResolvedValue([]);

      const result = await service.getDailySales('2025-12-28');

      expect(result.total_receipts).toBe(0);
      expect(result.total_revenue).toBe(0);
      expect(result.average_order_value).toBe(0);
    });
  });

  describe('getPeriodSales', () => {
    it('should return period sales report', async () => {
      const mockReceipts = [
        {
          id: 1,
          is_delivery: false,
          receiptItems: [
            {
              item: { price: 20.0 },
              quantity: 1,
              receiptItemDiscounts: [],
            },
          ],
          receiptDiscounts: [],
          baseEntity: {
            created_at: new Date('2025-12-25'),
            isdeleted: false,
          },
        },
      ];

      mockPrismaService.receipt.findMany.mockResolvedValue(mockReceipts);

      const result = await service.getPeriodSales({ period: '7days' });

      expect(result).toHaveProperty('start_date');
      expect(result).toHaveProperty('end_date');
      expect(result).toHaveProperty('total_receipts', 1);
      expect(result).toHaveProperty('total_revenue', 20.0);
    });
  });

  describe('getTopSellingItems', () => {
    it('should return top selling items sorted by quantity', async () => {
      const mockReceiptItems = [
        {
          item_id: 1,
          item: { id: 1, name: 'Burger', price: 10.0 },
          quantity: 50,
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
        {
          item_id: 2,
          item: { id: 2, name: 'Pizza', price: 15.0 },
          quantity: 30,
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
      ];

      mockPrismaService.receiptItem.findMany.mockResolvedValue(mockReceiptItems);

      const result = await service.getTopSellingItems({ limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Burger');
      expect(result.items[0].quantity_sold).toBe(50);
      expect(result.items[1].name).toBe('Pizza');
      expect(result.items[1].quantity_sold).toBe(30);
    });

    it('should limit results to specified number', async () => {
      const mockReceiptItems = Array.from({ length: 20 }, (_, i) => ({
        item_id: i + 1,
        item: { id: i + 1, name: `Item ${i + 1}`, price: 10.0 },
        quantity: 100 - i,
        baseEntity: {
          created_at: new Date('2025-12-28'),
          isdeleted: false,
        },
      }));

      mockPrismaService.receiptItem.findMany.mockResolvedValue(mockReceiptItems);

      const result = await service.getTopSellingItems({ limit: 5 });

      expect(result.items).toHaveLength(5);
    });
  });

  describe('getRevenueBySection', () => {
    it('should aggregate revenue by section', async () => {
      const mockReceiptItems = [
        {
          item: {
            section_id: 1,
            section: { id: 1, name: 'Appetizers' },
            price: 10.0,
          },
          quantity: 5,
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
        {
          item: {
            section_id: 2,
            section: { id: 2, name: 'Main Course' },
            price: 20.0,
          },
          quantity: 3,
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
      ];

      mockPrismaService.receiptItem.findMany.mockResolvedValue(mockReceiptItems);

      const result = await service.getRevenueBySection({ period: '7days' });

      expect(result.sections).toHaveLength(2);
      expect(result.total_revenue).toBe(110); // (10*5) + (20*3)
      expect(result.sections[0].revenue_percentage).toBeDefined();
    });
  });

  describe('getStaffPerformance', () => {
    it('should aggregate performance by staff member', async () => {
      const mockReceipts = [
        {
          baseEntity: {
            created_by: 1,
            created_at: new Date('2025-12-28'),
            isdeleted: false,
            createdByUser: {
              id: 1,
              fullname: 'John Doe',
              userRoles: [{ role: { name: 'Manager' } }],
            },
          },
          receiptItems: [
            {
              item: { price: 25.0 },
              quantity: 2,
              receiptItemDiscounts: [],
            },
          ],
          receiptDiscounts: [],
        },
      ];

      mockPrismaService.receipt.findMany.mockResolvedValue(mockReceipts);

      const result = await service.getStaffPerformance({ period: '7days' });

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].fullname).toBe('John Doe');
      expect(result.staff[0].orders_count).toBe(1);
      expect(result.staff[0].total_revenue).toBe(50.0);
    });
  });

  describe('getTableTurnover', () => {
    it('should aggregate turnover by table', async () => {
      const mockReceipts = [
        {
          table_id: 1,
          table: { id: 1, number: 5, status: 'OCCUPIED' },
          receiptItems: [
            {
              item: { price: 30.0 },
              quantity: 1,
              receiptItemDiscounts: [],
            },
          ],
          receiptDiscounts: [],
          baseEntity: {
            created_at: new Date('2025-12-28'),
            isdeleted: false,
          },
        },
      ];

      mockPrismaService.receipt.findMany.mockResolvedValue(mockReceipts);

      const result = await service.getTableTurnover({ period: '7days' });

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].table_number).toBe(5);
      expect(result.tables[0].orders_count).toBe(1);
      expect(result.tables[0].total_revenue).toBe(30.0);
    });
  });

  describe('getDiscountUsage', () => {
    it('should track discount usage', async () => {
      const mockReceiptDiscounts = [
        {
          discount_id: 1,
          discount: {
            id: 1,
            code: 'SAVE10',
            name: 'Save 10%',
            amount: null,
            persentage: 10,
          },
          receipt: {
            receiptItems: [
              {
                item: { price: 100.0 },
                quantity: 1,
              },
            ],
          },
        },
      ];

      mockPrismaService.receiptDiscount.findMany.mockResolvedValue(
        mockReceiptDiscounts,
      );
      mockPrismaService.receiptItemDiscount.findMany.mockResolvedValue([]);

      const result = await service.getDiscountUsage({ period: '7days' });

      expect(result.discounts).toHaveLength(1);
      expect(result.discounts[0].code).toBe('SAVE10');
      expect(result.discounts[0].times_used).toBe(1);
    });
  });
});

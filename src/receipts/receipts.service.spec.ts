import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { StatusEnum } from '@prisma/client';

describe('ReceiptsService', () => {
  let service: ReceiptsService;
  let prismaService: PrismaService;
  let baseEntityService: BaseEntityService;

  const mockPrismaService = {
    table: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
    },
    receipt: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    receiptItem: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    receiptItemDiscount: {
      findMany: jest.fn(),
    },
    baseEntity: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockBaseEntityService = {
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BaseEntityService,
          useValue: mockBaseEntityService,
        },
      ],
    }).compile();

    service = module.get<ReceiptsService>(ReceiptsService);
    prismaService = module.get<PrismaService>(PrismaService);
    baseEntityService = module.get<BaseEntityService>(BaseEntityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dineInDto = {
      is_delivery: false,
      table_id: 1,
      notes: 'Test order',
      items: [
        { item_id: 1, quantity: 2, notes: 'No onions' },
        { item_id: 2, quantity: 1, notes: null },
      ],
    };

    const deliveryDto = {
      is_delivery: true,
      phone_number: '+1234567890',
      location: '123 Main St',
      notes: 'Leave at door',
      items: [{ item_id: 1, quantity: 1, notes: null }],
    };

    it('should throw BadRequestException if delivery without phone/location', async () => {
      const invalidDto = {
        is_delivery: true,
        items: [{ item_id: 1, quantity: 1 }],
      };

      await expect(service.create(invalidDto as any, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if dine-in without table_id', async () => {
      const invalidDto = {
        is_delivery: false,
        items: [{ item_id: 1, quantity: 1 }],
      };

      await expect(service.create(invalidDto as any, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if table not found', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue(null);

      await expect(service.create(dineInDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if table is not available', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 1,
        number: 5,
        status: 'OCCUPIED',
        baseEntity: { isdeleted: false },
      });

      await expect(service.create(dineInDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if items not found', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 1,
        number: 5,
        status: 'AVAILABLE',
        baseEntity: { isdeleted: false },
      });

      mockPrismaService.item.findMany.mockResolvedValue([
        { id: 1, name: 'Item 1', price: 10 },
        // Missing item 2
      ]);

      await expect(service.create(dineInDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create dine-in receipt successfully', async () => {
      const mockTable = {
        id: 1,
        number: 5,
        status: 'AVAILABLE',
        baseEntity: { isdeleted: false },
      };

      const mockItems = [
        { id: 1, name: 'Burger', price: 12.99, section_id: 1 },
        { id: 2, name: 'Fries', price: 4.99, section_id: 1 },
      ];

      mockPrismaService.table.findUnique.mockResolvedValue(mockTable);
      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.baseEntity.create.mockResolvedValue({ id: 100 });
      mockPrismaService.receipt.findFirst.mockResolvedValue({ number: 50 });
      mockPrismaService.receipt.create.mockResolvedValue({
        id: 1,
        number: 51,
        is_delivery: false,
        table_id: 1,
      });
      mockPrismaService.receiptItem.create.mockResolvedValue({
        id: 1,
        receipt_id: 1,
        item_id: 1,
        quantity: 2,
        item: mockItems[0],
      });
      mockPrismaService.receiptItem.findMany.mockResolvedValue([
        { item: { price: 12.99 }, quantity: 2 },
        { item: { price: 4.99 }, quantity: 1 },
      ]);
      mockPrismaService.receiptItemDiscount.findMany.mockResolvedValue([]);

      const result = await service.create(dineInDto, 1);

      expect(result).toBeDefined();
      expect(result.number).toBe(51);
      expect(mockPrismaService.table.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'OCCUPIED' },
      });
    });

    it('should create delivery receipt successfully', async () => {
      const mockItems = [{ id: 1, name: 'Burger', price: 12.99 }];

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.baseEntity.create.mockResolvedValue({ id: 100 });
      mockPrismaService.receipt.findFirst.mockResolvedValue(null);
      mockPrismaService.receipt.create.mockResolvedValue({
        id: 1,
        number: 1,
        is_delivery: true,
        phone_number: '+1234567890',
        location: '123 Main St',
      });
      mockPrismaService.receiptItem.create.mockResolvedValue({
        id: 1,
        receipt_id: 1,
        item_id: 1,
        quantity: 1,
        item: mockItems[0],
      });
      mockPrismaService.receiptItem.findMany.mockResolvedValue([
        { item: { price: 12.99 }, quantity: 1 },
      ]);
      mockPrismaService.receiptItemDiscount.findMany.mockResolvedValue([]);

      const result = await service.create(deliveryDto, 1);

      expect(result).toBeDefined();
      expect(result.number).toBe(1);
      expect(mockPrismaService.table.update).not.toHaveBeenCalled();
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total correctly', async () => {
      mockPrismaService.receiptItem.findMany.mockResolvedValue([
        { item: { price: 12.99 }, quantity: 2 },
        { item: { price: 4.99 }, quantity: 1 },
      ]);
      mockPrismaService.receiptItemDiscount.findMany.mockResolvedValue([]);

      const result = await service.calculateTotal(1);

      expect(result.subtotal).toBe(30.97);
      expect(result.total_discount).toBe(0);
      expect(result.total).toBe(30.97);
    });
  });

  describe('complete', () => {
    it('should complete receipt and update table status', async () => {
      const mockReceipt = {
        id: 1,
        number: 100,
        table_id: 5,
        base_entity_id: 50,
        total: 30.97,
        baseEntity: { isdeleted: false, id: 50 },
        receiptItems: [],
        receiptDiscounts: [],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockReceipt as any);
      jest.spyOn(service, 'calculateTotal').mockResolvedValue({
        subtotal: 30.97,
        total_discount: 0,
        total: 30.97,
      });

      const result = await service.complete(1, 1);

      expect(result.message).toBe('Receipt completed successfully');
      expect(result.total).toBe(30.97);
      expect(mockPrismaService.table.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: 'AVAILABLE' },
      });
    });
  });
});

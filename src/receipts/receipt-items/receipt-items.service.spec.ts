import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReceiptItemsService } from './receipt-items.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { StatusEnum } from '../../common/enums';

describe('ReceiptItemsService', () => {
  let service: ReceiptItemsService;
  let prismaService: PrismaService;
  let baseEntityService: BaseEntityService;

  const mockPrismaService = {
    receiptItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockBaseEntityService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptItemsService,
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

    service = module.get<ReceiptItemsService>(ReceiptItemsService);
    prismaService = module.get<PrismaService>(PrismaService);
    baseEntityService = module.get<BaseEntityService>(BaseEntityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should update status successfully for valid transition', async () => {
      const mockReceiptItem = {
        id: 1,
        receipt_id: 100,
        status: StatusEnum.pending,
        base_entity_id: 50,
        baseEntity: { id: 50, isdeleted: false },
      };

      mockPrismaService.receiptItem.findFirst.mockResolvedValue(mockReceiptItem);
      mockPrismaService.receiptItem.update.mockResolvedValue({
        ...mockReceiptItem,
        status: StatusEnum.preparing,
      });
      mockBaseEntityService.update.mockResolvedValue({ id: 50 });

      const result = await service.updateStatus(100, 1, StatusEnum.preparing, 1);

      expect(result).toEqual({
        message: 'Status updated successfully',
        item_id: 1,
        previous_status: StatusEnum.pending,
        new_status: StatusEnum.preparing,
      });
      expect(mockPrismaService.receiptItem.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: StatusEnum.preparing },
      });
      expect(mockBaseEntityService.update).toHaveBeenCalledWith(50, 1);
    });

    it('should throw NotFoundException if receipt item not found', async () => {
      mockPrismaService.receiptItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(100, 999, StatusEnum.preparing, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockReceiptItem = {
        id: 1,
        receipt_id: 100,
        status: StatusEnum.pending,
        base_entity_id: 50,
        baseEntity: { id: 50, isdeleted: false },
      };

      mockPrismaService.receiptItem.findFirst.mockResolvedValue(mockReceiptItem);

      await expect(
        service.updateStatus(100, 1, StatusEnum.done, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not allow transition from done status', async () => {
      const mockReceiptItem = {
        id: 1,
        receipt_id: 100,
        status: StatusEnum.done,
        base_entity_id: 50,
        baseEntity: { id: 50, isdeleted: false },
      };

      mockPrismaService.receiptItem.findFirst.mockResolvedValue(mockReceiptItem);

      await expect(
        service.updateStatus(100, 1, StatusEnum.pending, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid status workflow transitions', async () => {
      const testCases = [
        { from: StatusEnum.pending, to: StatusEnum.preparing },
        { from: StatusEnum.preparing, to: StatusEnum.ready },
        { from: StatusEnum.ready, to: StatusEnum.done },
      ];

      for (const { from, to } of testCases) {
        const mockReceiptItem = {
          id: 1,
          receipt_id: 100,
          status: from,
          base_entity_id: 50,
          baseEntity: { id: 50, isdeleted: false },
        };

        mockPrismaService.receiptItem.findFirst.mockResolvedValue(mockReceiptItem);
        mockPrismaService.receiptItem.update.mockResolvedValue({
          ...mockReceiptItem,
          status: to,
        });

        await expect(service.updateStatus(100, 1, to, 1)).resolves.toBeDefined();
      }
    });
  });
});

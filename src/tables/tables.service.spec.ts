import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TablesService } from './tables.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseEntityService } from '../common/base-entity/base-entity.service';
import { TableStatus } from '../common/enums';

describe('TablesService', () => {
  let service: TablesService;
  let prisma: PrismaService;
  let baseEntityService: BaseEntityService;

  const mockBaseEntity = {
    id: 1,
    created_at: new Date(),
    created_by: 1,
    updated_at: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    isdeleted: false,
  };

  const mockTable = {
    id: 1,
    number: 5,
    status: TableStatus.AVAILABLE,
    base_entity_id: 1,
    baseEntity: mockBaseEntity,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        {
          provide: PrismaService,
          useValue: {
            table: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: BaseEntityService,
          useValue: {
            create: jest.fn(() => mockBaseEntity),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    prisma = module.get<PrismaService>(PrismaService);
    baseEntityService = module.get<BaseEntityService>(BaseEntityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all non-deleted tables', async () => {
      const tables = [mockTable];
      (prisma.table.findMany as jest.Mock).mockResolvedValue(tables);

      const result = await service.findAll();

      expect(result).toEqual(tables);
      expect(prisma.table.findMany).toHaveBeenCalledWith({
        where: { baseEntity: { isdeleted: false } },
        include: { baseEntity: true },
        orderBy: { number: 'asc' },
      });
    });

    it('should filter by status', async () => {
      const tables = [mockTable];
      (prisma.table.findMany as jest.Mock).mockResolvedValue(tables);

      await service.findAll({ status: TableStatus.AVAILABLE });

      expect(prisma.table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TableStatus.AVAILABLE,
          }),
        }),
      );
    });
  });

  describe('findAvailable', () => {
    it('should return only available tables', async () => {
      const tables = [mockTable];
      (prisma.table.findMany as jest.Mock).mockResolvedValue(tables);

      const result = await service.findAvailable();

      expect(result).toEqual(tables);
      expect(prisma.table.findMany).toHaveBeenCalledWith({
        where: {
          status: TableStatus.AVAILABLE,
          baseEntity: { isdeleted: false },
        },
        include: { baseEntity: true },
        orderBy: { number: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a table by ID', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTable);
      expect(prisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { baseEntity: true },
      });
    });

    it('should throw NotFoundException if table not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if table is deleted', async () => {
      const deletedTable = {
        ...mockTable,
        baseEntity: { ...mockBaseEntity, isdeleted: true },
      };
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(deletedTable);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new table with unique number', async () => {
      const createDto = { number: 5 };

      (prisma.table.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.table.create as jest.Mock).mockResolvedValue(mockTable);

      const result = await service.create(createDto, 1);

      expect(baseEntityService.create).toHaveBeenCalledWith(1);
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          number: createDto.number,
          status: TableStatus.AVAILABLE,
          base_entity_id: mockBaseEntity.id,
        },
        include: { baseEntity: true },
      });
      expect(result).toEqual(mockTable);
    });

    it('should throw ConflictException for duplicate table number', async () => {
      const createDto = { number: 5 };

      (prisma.table.findFirst as jest.Mock).mockResolvedValue(mockTable);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto, 1)).rejects.toThrow(
        'Table number 5 already exists',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update table status with audit trail', async () => {
      const updateDto = { status: TableStatus.OCCUPIED };
      const updatedTable = { ...mockTable, status: TableStatus.OCCUPIED };

      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
      (prisma.table.update as jest.Mock).mockResolvedValue(updatedTable);

      const result = await service.updateStatus(1, updateDto, 1);

      expect(baseEntityService.update).toHaveBeenCalledWith(
        mockTable.base_entity_id,
        1,
      );
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: updateDto.status },
        include: { baseEntity: true },
      });
      expect(result).toEqual(updatedTable);
    });

    it('should throw NotFoundException if table not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus(999, { status: TableStatus.OCCUPIED }, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a table', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

      const result = await service.remove(1, 1);

      expect(baseEntityService.softDelete).toHaveBeenCalledWith(
        mockTable.base_entity_id,
        1,
      );
      expect(result).toEqual({ message: 'Table deleted successfully' });
    });

    it('should throw NotFoundException if table not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});

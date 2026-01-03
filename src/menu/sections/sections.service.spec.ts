import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';

describe('SectionsService', () => {
  let service: SectionsService;
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

  const mockSection = {
    id: 1,
    name: 'Appetizers',
    base_entity_id: 1,
    baseEntity: mockBaseEntity,
    items: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        {
          provide: PrismaService,
          useValue: {
            section: {
              findMany: jest.fn(),
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

    service = module.get<SectionsService>(SectionsService);
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
    it('should return an array of non-deleted sections', async () => {
      const sections = [mockSection];
      (prisma.section.findMany as jest.Mock).mockResolvedValue(sections);

      const result = await service.findAll();

      expect(result).toEqual(sections);
      expect(prisma.section.findMany).toHaveBeenCalledWith({
        where: { baseEntity: { isdeleted: false } },
        include: { baseEntity: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a section by ID', async () => {
      (prisma.section.findUnique as jest.Mock).mockResolvedValue(mockSection);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSection);
      expect(prisma.section.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          baseEntity: true,
          items: {
            where: { baseEntity: { isdeleted: false } },
            include: { image: true },
          },
        },
      });
    });

    it('should throw NotFoundException if section not found', async () => {
      (prisma.section.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if section is deleted', async () => {
      const deletedSection = {
        ...mockSection,
        baseEntity: { ...mockBaseEntity, isdeleted: true },
      };
      (prisma.section.findUnique as jest.Mock).mockResolvedValue(
        deletedSection,
      );

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new section with base entity', async () => {
      const createDto = { name: 'Appetizers' };
      (prisma.section.create as jest.Mock).mockResolvedValue(mockSection);

      const result = await service.create(createDto, 1);

      expect(baseEntityService.create).toHaveBeenCalledWith(1);
      expect(prisma.section.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          base_entity_id: mockBaseEntity.id,
        },
        include: { baseEntity: true },
      });
      expect(result).toEqual(mockSection);
    });
  });

  describe('update', () => {
    it('should update a section and audit trail', async () => {
      const updateDto = { name: 'Updated Appetizers' };
      const updatedSection = { ...mockSection, name: updateDto.name };

      (prisma.section.findUnique as jest.Mock).mockResolvedValue(mockSection);
      (prisma.section.update as jest.Mock).mockResolvedValue(updatedSection);

      const result = await service.update(1, updateDto, 1);

      expect(baseEntityService.update).toHaveBeenCalledWith(
        mockSection.base_entity_id,
        1,
      );
      expect(prisma.section.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: updateDto.name },
        include: { baseEntity: true },
      });
      expect(result).toEqual(updatedSection);
    });

    it('should throw NotFoundException if section not found', async () => {
      (prisma.section.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a section', async () => {
      (prisma.section.findUnique as jest.Mock).mockResolvedValue(mockSection);

      const result = await service.remove(1, 1);

      expect(baseEntityService.softDelete).toHaveBeenCalledWith(
        mockSection.base_entity_id,
        1,
      );
      expect(result).toEqual({ message: 'Section deleted successfully' });
    });

    it('should throw NotFoundException if section not found', async () => {
      (prisma.section.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});

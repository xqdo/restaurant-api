import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseEntityService } from '../../common/base-entity/base-entity.service';
import { ImagesService } from '../images/images.service';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: PrismaService;
  let baseEntityService: BaseEntityService;
  let imagesService: ImagesService;

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
  };

  const mockItem = {
    id: 1,
    name: 'Grilled Salmon',
    section_id: 1,
    price: 24.99,
    description: 'Fresh salmon',
    image_id: null,
    base_entity_id: 1,
    section: mockSection,
    image: null,
    baseEntity: mockBaseEntity,
  };

  const mockImage = {
    id: 1,
    path: 'uploads/menu-items/item-123456789-987654321.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: PrismaService,
          useValue: {
            item: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            section: {
              findUnique: jest.fn(),
            },
            image: {
              findUnique: jest.fn(),
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
        {
          provide: ImagesService,
          useValue: {
            create: jest.fn(() => mockImage),
          },
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    prisma = module.get<PrismaService>(PrismaService);
    baseEntityService = module.get<BaseEntityService>(BaseEntityService);
    imagesService = module.get<ImagesService>(ImagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all non-deleted items', async () => {
      const items = [mockItem];
      (prisma.item.findMany as jest.Mock).mockResolvedValue(items);

      const result = await service.findAll({});

      expect(result).toEqual(items);
      expect(prisma.item.findMany).toHaveBeenCalled();
    });

    it('should filter by section_id', async () => {
      (prisma.item.findMany as jest.Mock).mockResolvedValue([mockItem]);

      await service.findAll({ section_id: 1 });

      expect(prisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            section_id: 1,
          }),
        }),
      );
    });

    it('should search by name', async () => {
      (prisma.item.findMany as jest.Mock).mockResolvedValue([mockItem]);

      await service.findAll({ search: 'salmon' });

      expect(prisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'salmon', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      (prisma.item.findMany as jest.Mock).mockResolvedValue([mockItem]);

      await service.findAll({ min_price: 10, max_price: 30 });

      expect(prisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 10, lte: 30 },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an item by ID', async () => {
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.findOne(1);

      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item is deleted', async () => {
      const deletedItem = {
        ...mockItem,
        baseEntity: { ...mockBaseEntity, isdeleted: true },
      };
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(deletedItem);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new item with valid section_id', async () => {
      const createDto = {
        name: 'Grilled Salmon',
        section_id: 1,
        price: 24.99,
        description: 'Fresh salmon',
      };

      (prisma.section.findUnique as jest.Mock).mockResolvedValue(mockSection);
      (prisma.item.create as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.create(createDto, 1);

      expect(baseEntityService.create).toHaveBeenCalledWith(1);
      expect(prisma.item.create).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });

    it('should throw BadRequestException for invalid section_id', async () => {
      const createDto = {
        name: 'Test Item',
        section_id: 999,
        price: 10.0,
      };

      (prisma.section.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid image_id', async () => {
      const createDto = {
        name: 'Test Item',
        section_id: 1,
        price: 10.0,
        image_id: 999,
      };

      (prisma.section.findUnique as jest.Mock).mockResolvedValue(mockSection);
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateDto = { name: 'Updated Salmon' };
      const updatedItem = { ...mockItem, name: updateDto.name };

      (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
      (prisma.item.update as jest.Mock).mockResolvedValue(updatedItem);

      const result = await service.update(1, updateDto, 1);

      expect(baseEntityService.update).toHaveBeenCalledWith(
        mockItem.base_entity_id,
        1,
      );
      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadImage', () => {
    it('should upload image and update item', async () => {
      const file = {
        path: 'uploads/menu-items/item-123456789-987654321.jpg',
      } as Express.Multer.File;

      const updatedItem = { ...mockItem, image_id: mockImage.id };

      (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
      (prisma.item.update as jest.Mock).mockResolvedValue(updatedItem);

      const result = await service.uploadImage(1, file, 1);

      expect(imagesService.create).toHaveBeenCalledWith(file.path);
      expect(baseEntityService.update).toHaveBeenCalled();
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { image_id: mockImage.id },
        include: {
          section: true,
          image: true,
          baseEntity: true,
        },
      });
      expect(result).toEqual(updatedItem);
    });
  });

  describe('remove', () => {
    it('should soft delete an item', async () => {
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.remove(1, 1);

      expect(baseEntityService.softDelete).toHaveBeenCalledWith(
        mockItem.base_entity_id,
        1,
      );
      expect(result).toEqual({ message: 'Item deleted successfully' });
    });

    it('should throw NotFoundException if item not found', async () => {
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImagesService } from './images.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ImagesService', () => {
  let service: ImagesService;
  let prisma: PrismaService;

  const mockImage = {
    id: 1,
    path: 'uploads/menu-items/item-123456789-987654321.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: PrismaService,
          useValue: {
            image: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an image record', async () => {
      const path = 'uploads/menu-items/item-123456789-987654321.jpg';
      (prisma.image.create as jest.Mock).mockResolvedValue(mockImage);

      const result = await service.create(path);

      expect(prisma.image.create).toHaveBeenCalledWith({
        data: { path },
      });
      expect(result).toEqual(mockImage);
    });
  });

  describe('findOne', () => {
    it('should return an image by ID', async () => {
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(mockImage);

      const result = await service.findOne(1);

      expect(prisma.image.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockImage);
    });

    it('should throw NotFoundException if image not found', async () => {
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});

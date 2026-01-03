import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { FilterItemsDto } from '../dto/filter-items.dto';
import { MenuItemResponseDto } from '../dto/menu-item-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import {
  UnauthorizedResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  BadRequestResponseDto,
  InternalServerErrorResponseDto,
} from '../../common/dto/error-response.dto';

@ApiTags('menu-items')
@Controller('menu/items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @ApiOperation({
    summary: 'Get all menu items with optional filters',
    description: `
      Retrieve a list of menu items with optional filtering.

      **Available Filters:**
      - section_id: Filter by menu section
      - search: Search by item name (case-insensitive)
      - min_price: Minimum price filter
      - max_price: Maximum price filter

      **Returns:**
      - All active (non-deleted) items matching the filters
      - Each item includes section information
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of menu items',
    type: [MenuItemResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @ApiBearerAuth('JWT-auth')
  @Get()
  findAll(@Query() query: FilterItemsDto) {
    return this.itemsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns item details',
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create new menu item (Manager/Admin only)',
    description: `
      Add a new item to the menu.

      **Business Rules:**
      - Section ID must exist
      - Item name is required (max 255 characters)
      - Price must be >= 0
      - Image ID is optional (upload image separately)
      - Description is optional

      **Note:**
      - Upload item image separately using POST /:id/image endpoint
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Menu item created successfully',
    type: MenuItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation failed or invalid section_id',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('Admin', 'Manager')
  @Post()
  create(@Body() createItemDto: CreateItemDto, @CurrentUser() user: User) {
    return this.itemsService.create(createItemDto, user.id);
  }

  @ApiOperation({ summary: 'Update menu item (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentUser() user: User,
  ) {
    return this.itemsService.update(id, updateItemDto, user.id);
  }

  @ApiOperation({
    summary: 'Upload image for menu item (Manager/Admin only)',
    description: `
      Upload an image for a menu item. The image will be stored on the server and accessible via the uploads path.

      **File Requirements:**
      - Accepted formats: JPG, JPEG, PNG, GIF
      - Maximum file size: 5MB
      - Only one image per item (overwrites existing)

      **Stored Location:**
      - Images are saved to: ./uploads/menu-items/
      - URL format: /uploads/menu-items/item-{timestamp}-{random}.{ext}

      **Usage:**
      1. Select image file
      2. Upload via this endpoint
      3. Image path is automatically associated with the item
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      example: {
        id: 15,
        name: 'Grilled Salmon',
        image_path: '/uploads/menu-items/item-1703847281234-987654321.jpg',
        message: 'Image uploaded successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type (must be jpg/jpeg/png/gif) or file size exceeds 5MB',
    type: BadRequestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Menu item not found',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, jpeg, png, or gif, max 5MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @Roles('Admin', 'Manager')
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/menu-items',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `item-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.itemsService.uploadImage(id, file, user.id);
  }

  @ApiOperation({ summary: 'Soft delete menu item (Manager/Admin only)' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Manager or Admin role required',
  })
  @ApiBearerAuth()
  @Roles('Admin', 'Manager')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.itemsService.remove(id, user.id);
  }
}

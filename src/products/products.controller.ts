import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
    Patch,
    Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all products' })
    @ApiResponse({
        status: 200,
        description: 'Products retrieved successfully',
    })
    findAll(@Query() query: QueryProductsDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    @ApiResponse({
        status: 200,
        description: 'Product retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a product with images' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'iPhone 17 Pro',
                },
                description: {
                    type: 'string',
                    example: 'Latest iPhone model',
                },
                price: {
                    type: 'number',
                    example: 999.99,
                },
                stock: {
                    type: 'number',
                    example: 10,
                },
                is_active: {
                    type: 'boolean',
                    example: true,
                },
                category_id: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440000',
                },
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            storage: diskStorage({
                destination: './uploads/products',
                filename: (_req, file, cb) => {
                    const extension = extname(file.originalname);
                    cb(null, `${randomUUID()}${extension}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (_req, file, cb) => {
                const allowedMimeTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ];

                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return cb(
                        new Error(
                            'Only JPEG, PNG, and WebP images are allowed',
                        ),
                        false,
                    );
                }

                cb(null, true);
            },
        }),
    )
    create(
        @Body() dto: CreateProductDto,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.productsService.create(dto, files);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update a product' })
    @ApiResponse({
        status: 200,
        description: 'Product updated successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productsService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a product' })
    @ApiResponse({
        status: 200,
        description: 'Product deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    remove(@Param('id') id: string): Promise<void> {
        return this.productsService.remove(id);
    }

    @Delete(':id/images/:imageId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete a product image' })
    @ApiResponse({
        status: 200,
        description: 'Product image deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product image not found',
    })
    removeImage(
        @Param('id') productId: string,
        @Param('imageId') imageId: string,
    ): Promise<void> {
        return this.productsService.removeImage(productId, imageId);
    }

    @Post(':id/images')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(
        FilesInterceptor('images', 10, {
            storage: diskStorage({
                destination: './uploads/products',
                filename: (_req, file, cb) => {
                    const extension = extname(file.originalname);

                    cb(null, `${randomUUID()}${extension}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (_req, file, cb) => {
                const allowedMimeTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ];

                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return cb(
                        new Error(
                            'Only JPEG, PNG, and WebP images are allowed',
                        ),
                        false,
                    );
                }

                cb(null, true);
            },
        }),
    )
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Add images to a product' })
    @ApiResponse({
        status: 201,
        description: 'Product images added successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    addImages(
        @Param('id') productId: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.productsService.addImages(productId, files);
    }
}

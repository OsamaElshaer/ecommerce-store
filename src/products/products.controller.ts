import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';

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
    @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'Lavender Scented Candle',
                },
                description: {
                    type: 'string',
                    example: 'A calming lavender-scented soy candle, 200g.',
                },
                price: {
                    type: 'number',
                    example: 149.99,
                },
                stock: {
                    type: 'integer',
                    example: 50,
                },
                is_active: {
                    type: 'boolean',
                    example: true,
                },
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['name', 'description', 'price', 'stock', 'image'],
        },
    })
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/products',
                filename: (_req, file, callback) => {
                    const extension = extname(file.originalname);
                    callback(null, `${randomUUID()}${extension}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (_req, file, callback) => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

                if (!allowedTypes.includes(file.mimetype)) {
                    return callback(
                        new Error(
                            'Only JPEG, PNG, and WebP images are allowed',
                        ),
                        false,
                    );
                }

                callback(null, true);
            },
        }),
    )
    create(
        @Body() dto: CreateProductDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.productsService.create(dto, file);
    }
}

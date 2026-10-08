import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { join } from 'node:path';

import { Product } from './entities/product.entity';

import { ProductImage } from './entities/product-image.entity';

import { QueryProductsDto, ProductSort } from './dto/query-products.dto';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';

import { StorageService } from '../storage/storage.service';

import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,

        @InjectRepository(ProductImage)
        private readonly productImagesRepository: Repository<ProductImage>,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        private readonly storageService: StorageService,

        @InjectPinoLogger(ProductsService.name)
        private readonly logger: PinoLogger,
    ) {}

    async findAll(query: QueryProductsDto) {
        this.logger.info({ query }, 'Fetching products');

        const {
            page = 1,
            limit = 20,
            search,
            minPrice,
            maxPrice,
            sort,
            category_id,
        } = query;

        const qb = this.productsRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.is_active = :isActive', {
                isActive: true,
            });

        if (category_id) {
            qb.andWhere('product.category_id = :category_id', {
                category_id,
            });
        }
        if (search) {
            qb.andWhere('product.name ILIKE :search', {
                search: `%${search}%`,
            });
        }

        if (minPrice !== undefined) {
            qb.andWhere('product.price >= :minPrice', {
                minPrice,
            });
        }

        if (maxPrice !== undefined) {
            qb.andWhere('product.price <= :maxPrice', {
                maxPrice,
            });
        }

        switch (sort) {
            case ProductSort.PRICE_ASC:
                qb.orderBy('product.price', 'ASC');
                break;

            case ProductSort.PRICE_DESC:
                qb.orderBy('product.price', 'DESC');
                break;

            case ProductSort.NEWEST:
            default:
                qb.orderBy('product.created_at', 'DESC');
                break;
        }

        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        this.logger.info(
            { page, limit, total },
            'Products fetched successfully',
        );

        return {
            data,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async findOne(id: string): Promise<Product> {
        this.logger.info({ productId: id }, 'Fetching product');

        const product = await this.productsRepository.findOne({
            where: {
                id,
                is_active: true,
            },
            relations: {
                images: true,
            },
        });

        if (!product) {
            this.logger.warn({ productId: id }, 'Product not found');

            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async create(
        dto: CreateProductDto,
        files: Express.Multer.File[],
    ): Promise<{
        message: string;
        id: string;
    }> {
        this.logger.info(
            { imageCount: files?.length ?? 0 },
            'Creating product',
        );

        const category = await this.categoryRepository.findOne({
            where: {
                id: dto.category_id,
            },
        });

        if (!category) {
            this.logger.warn(
                { categoryId: dto.category_id },
                'Category not found',
            );

            throw new NotFoundException('Category not found');
        }

        const product = this.productsRepository.create(dto);

        const savedProduct = await this.productsRepository.save(product);

        if (files?.length) {
            const images = files.map((file, index) =>
                this.productImagesRepository.create({
                    product_id: savedProduct.id,
                    image_url: `/uploads/products/${file.filename}`,
                    is_primary: index === 0,
                    position: index,
                }),
            );

            await this.productImagesRepository.save(images);
        }

        this.logger.info(
            {
                productId: savedProduct.id,
                categoryId: savedProduct.category_id,
                imageCount: files?.length ?? 0,
            },
            'Product created successfully',
        );

        return {
            message: 'Product created successfully',
            id: savedProduct.id,
        };
    }

    async update(id: string, dto: UpdateProductDto): Promise<Product> {
        this.logger.info({ productId: id }, 'Updating product');

        const product = await this.productsRepository.findOne({
            where: { id },
        });

        if (!product) {
            this.logger.warn({ productId: id }, 'Product not found');

            throw new NotFoundException('Product not found');
        }

        if (dto.category_id) {
            const category = await this.categoryRepository.findOne({
                where: {
                    id: dto.category_id,
                },
            });

            if (!category) {
                this.logger.warn(
                    { categoryId: dto.category_id },
                    'Category not found',
                );

                throw new NotFoundException('Category not found');
            }
        }

        Object.assign(product, dto);

        await this.productsRepository.save(product);

        this.logger.info({ productId: id }, 'Product updated successfully');

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        this.logger.info({ productId: id }, 'Deleting product');

        const product = await this.productsRepository.findOne({
            where: { id },
            relations: {
                images: true,
            },
        });

        if (!product) {
            this.logger.warn({ productId: id }, 'Product not found');

            throw new NotFoundException('Product not found');
        }

        for (const image of product.images) {
            const relativePath = image.image_url.replace(/^\/+/, '');
            const filePath = join(process.cwd(), relativePath);

            await this.storageService.deleteFile(filePath);
        }

        await this.productsRepository.delete(id);

        this.logger.info(
            {
                productId: id,
                imageCount: product.images.length,
            },
            'Product deleted successfully',
        );
    }

    async removeImage(productId: string, imageId: string): Promise<void> {
        this.logger.info({ productId, imageId }, 'Deleting product image');

        const image = await this.productImagesRepository.findOne({
            where: {
                id: imageId,
                product_id: productId,
            },
        });

        if (!image) {
            this.logger.warn({ productId, imageId }, 'Product image not found');

            throw new NotFoundException('Product image not found');
        }

        const relativePath = image.image_url.replace(/^\/+/, '');
        const filePath = join(process.cwd(), relativePath);

        await this.storageService.deleteFile(filePath);

        await this.productImagesRepository.delete(image.id);

        this.logger.info(
            { productId, imageId },
            'Product image deleted successfully',
        );
    }

    async addImages(
        productId: string,
        files: Express.Multer.File[],
    ): Promise<Product> {
        this.logger.info(
            {
                productId,
                imageCount: files.length,
            },
            'Adding images to product',
        );

        const product = await this.productsRepository.findOne({
            where: {
                id: productId,
            },
            relations: {
                images: true,
            },
        });

        if (!product) {
            this.logger.warn({ productId }, 'Product not found');

            throw new NotFoundException('Product not found');
        }

        const startPosition = product.images.length;

        const images = files.map((file, index) =>
            this.productImagesRepository.create({
                product_id: product.id,
                image_url: `/uploads/products/${file.filename}`,
                is_primary: product.images.length === 0 && index === 0,
                position: startPosition + index,
            }),
        );

        await this.productImagesRepository.save(images);

        this.logger.info(
            {
                productId,
                imageCount: files.length,
            },
            'Product images added successfully',
        );

        return this.findOne(productId);
    }
}

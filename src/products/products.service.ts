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

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,

        @InjectRepository(ProductImage)
        private readonly productImagesRepository: Repository<ProductImage>,

        private readonly storageService: StorageService,
        @InjectPinoLogger(ProductsService.name)
        private readonly logger: PinoLogger,
    ) {}

    async findAll(query: QueryProductsDto) {
        const {
            page = 1,
            limit = 20,
            search,
            minPrice,
            maxPrice,
            sort,
        } = query;

        const qb = this.productsRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.is_active = :isActive', {
                isActive: true,
            });

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

        return {
            message: 'Product created successfully',
            id: savedProduct.id,
        };
    }

    async update(id: string, dto: UpdateProductDto): Promise<Product> {
        const product = await this.productsRepository.findOne({
            where: { id },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        Object.assign(product, dto);

        await this.productsRepository.save(product);

        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const product = await this.productsRepository.findOne({
            where: { id },
            relations: {
                images: true,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        for (const image of product.images) {
            const relativePath = image.image_url.replace(/^\/+/, '');

            const filePath = join(process.cwd(), relativePath);

            await this.storageService.deleteFile(filePath);
        }

        await this.productsRepository.delete(id);
    }

    async removeImage(productId: string, imageId: string): Promise<void> {
        const image = await this.productImagesRepository.findOne({
            where: {
                id: imageId,
                product_id: productId,
            },
        });

        if (!image) {
            throw new NotFoundException('Product image not found');
        }

        const relativePath = image.image_url.replace(/^\/+/, '');

        const filePath = join(process.cwd(), relativePath);

        await this.storageService.deleteFile(filePath);

        await this.productImagesRepository.delete(image.id);
    }

    async addImages(
        productId: string,
        files: Express.Multer.File[],
    ): Promise<Product> {
        const product = await this.productsRepository.findOne({
            where: {
                id: productId,
            },
            relations: {
                images: true,
            },
        });

        if (!product) {
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

        return this.findOne(productId);
    }
}

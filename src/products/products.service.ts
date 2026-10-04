import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { QueryProductsDto, ProductSort } from './dto/query-products.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        @InjectRepository(ProductImage)
        private readonly productImagesRepository: Repository<ProductImage>,
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
            .where('product.is_active = :isActive', { isActive: true });

        if (search) {
            qb.andWhere('product.name ILIKE :search', {
                search: `%${search}%`,
            });
        }

        if (minPrice !== undefined) {
            qb.andWhere('product.price >= :minPrice', { minPrice });
        }

        if (maxPrice !== undefined) {
            qb.andWhere('product.price <= :maxPrice', { maxPrice });
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
            meta: { page, limit, total },
        };
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productsRepository.findOne({
            where: { id, is_active: true },
            relations: { images: true },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async create(
        dto: CreateProductDto,
        file: Express.Multer.File,
    ): Promise<Product> {
        const product = this.productsRepository.create(dto);

        const savedProduct = await this.productsRepository.save(product);

        if (file) {
            const image = this.productImagesRepository.create({
                product_id: savedProduct.id,
                image_url: `/uploads/products/${file.filename}`,
                is_primary: true,
                position: 0,
            });

            await this.productImagesRepository.save(image);
        }

        return this.findOne(savedProduct.id);
    }
}

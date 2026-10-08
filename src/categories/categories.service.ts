import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        @InjectPinoLogger(CategoriesService.name)
        private readonly logger: PinoLogger,
    ) {}

    async create(dto: CreateCategoryDto): Promise<Category> {
        const existingCategory = await this.categoryRepository.findOne({
            where: [{ name: dto.name }, { slug: dto.slug }],
        });

        if (existingCategory) {
            this.logger.warn(
                {
                    name: dto.name,
                    slug: dto.slug,
                },
                'Category name or slug already exists',
            );

            throw new ConflictException('Category name or slug already exists');
        }

        const category = this.categoryRepository.create(dto);

        const savedCategory = await this.categoryRepository.save(category);

        this.logger.info(
            {
                categoryId: savedCategory.id,
                name: savedCategory.name,
            },
            'Category created',
        );

        return savedCategory;
    }

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({
            order: {
                created_at: 'DESC',
            },
        });
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: {
                id,
            },
        });

        if (!category) {
            this.logger.warn({ categoryId: id }, 'Category not found');

            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        if (dto.name || dto.slug) {
            const conditions: ({ name: string } | { slug: string })[] = [];
            if (dto.name) {
                conditions.push({ name: dto.name });
            }

            if (dto.slug) {
                conditions.push({ slug: dto.slug });
            }

            const existingCategory = await this.categoryRepository.findOne({
                where: conditions,
            });

            if (existingCategory && existingCategory.id !== id) {
                this.logger.warn(
                    {
                        categoryId: id,
                        name: dto.name,
                        slug: dto.slug,
                    },
                    'Category name or slug already exists',
                );

                throw new ConflictException(
                    'Category name or slug already exists',
                );
            }
        }

        Object.assign(category, dto);

        const updatedCategory = await this.categoryRepository.save(category);

        this.logger.info(
            {
                categoryId: id,
            },
            'Category updated',
        );

        return updatedCategory;
    }

    async remove(id: string): Promise<void> {
        const category = await this.findOne(id);

        const productsCount = await this.productRepository.count({
            where: {
                category_id: id,
            },
        });

        if (productsCount > 0) {
            this.logger.warn(
                {
                    categoryId: id,
                    productsCount,
                },
                'Cannot delete category with products',
            );

            throw new ConflictException(
                'Cannot delete a category that has products',
            );
        }

        await this.categoryRepository.remove(category);

        this.logger.info(
            {
                categoryId: id,
            },
            'Category deleted',
        );
    }
}

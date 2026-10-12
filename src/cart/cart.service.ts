import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private readonly cartRepository: Repository<Cart>,

        @InjectRepository(CartItem)
        private readonly cartItemRepository: Repository<CartItem>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        private readonly dataSource: DataSource,

        @InjectPinoLogger(CartService.name)
        private readonly logger: PinoLogger,
    ) {}

    private async lockCart(
        manager: EntityManager,
        userId: string,
    ): Promise<Cart> {
        const cart = await manager.findOne(Cart, {
            where: {
                user_id: userId,
            },
            lock: {
                mode: 'pessimistic_write',
            },
        });

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        return cart;
    }

    async getCart(userId: string): Promise<Cart> {
        let cart = await this.cartRepository.findOne({
            where: {
                user_id: userId,
            },
            relations: {
                items: {
                    product: true,
                },
            },
        });

        if (!cart) {
            cart = this.cartRepository.create({
                user_id: userId,
            });

            await this.cartRepository.save(cart);

            cart.items = [];
        }
        this.logger.info('Retrieved cart for user', {
            userId,
            cartId: cart.id,
        });
        return cart;
    }

    async addItem(userId: string, dto: AddCartItemDto): Promise<Cart> {
        await this.dataSource.transaction(async (manager) => {
            const cart = await this.lockCart(manager, userId);

            const product = await manager.findOne(Product, {
                where: {
                    id: dto.product_id,
                    is_active: true,
                },
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const existingItem = await manager.findOne(CartItem, {
                where: {
                    cart_id: cart.id,
                    product_id: product.id,
                },
            });

            const newQuantity = existingItem
                ? existingItem.quantity + dto.quantity
                : dto.quantity;

            if (newQuantity > product.stock) {
                throw new BadRequestException(
                    `Only ${product.stock} items are available`,
                );
            }

            if (existingItem) {
                existingItem.quantity = newQuantity;
                await manager.save(CartItem, existingItem);
            } else {
                const cartItem = manager.create(CartItem, {
                    cart_id: cart.id,
                    product_id: product.id,
                    quantity: dto.quantity,
                });

                await manager.save(CartItem, cartItem);
            }
        });

        this.logger.info(
            {
                userId,
                productId: dto.product_id,
                quantity: dto.quantity,
            },
            'Product added to cart',
        );

        return this.getCart(userId);
    }

    async updateItem(
        userId: string,
        itemId: string,
        dto: UpdateCartItemDto,
    ): Promise<Cart> {
        await this.dataSource.transaction(async (manager) => {
            const cart = await this.lockCart(manager, userId);

            const cartItem = await manager.findOne(CartItem, {
                where: {
                    id: itemId,
                    cart_id: cart.id,
                },
            });

            if (!cartItem) {
                throw new NotFoundException('Cart item not found');
            }

            const product = await manager.findOne(Product, {
                where: {
                    id: cartItem.product_id,
                    is_active: true,
                },
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            if (dto.quantity > product.stock) {
                throw new BadRequestException(
                    `Only ${product.stock} items are available`,
                );
            }

            cartItem.quantity = dto.quantity;

            await manager.save(CartItem, cartItem);
        });

        this.logger.info(
            {
                userId,
                itemId,
                quantity: dto.quantity,
            },
            'Cart item quantity updated',
        );

        return this.getCart(userId);
    }

    async removeItem(userId: string, itemId: string): Promise<Cart> {
        await this.dataSource.transaction(async (manager) => {
            const cart = await this.lockCart(manager, userId);

            const cartItem = await manager.findOne(CartItem, {
                where: {
                    id: itemId,
                    cart_id: cart.id,
                },
            });

            if (!cartItem) {
                throw new NotFoundException('Cart item not found');
            }

            await manager.remove(CartItem, cartItem);
        });

        this.logger.info(
            {
                userId,
                itemId,
            },
            'Cart item removed',
        );

        return this.getCart(userId);
    }
}

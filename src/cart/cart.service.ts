import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

        @InjectPinoLogger(CartService.name)
        private readonly logger: PinoLogger,
    ) {}

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
        const cart = await this.getCart(userId);

        const product = await this.productRepository.findOne({
            where: {
                id: dto.product_id,
                is_active: true,
            },
        });

        if (!product) {
            this.logger.warn(
                {
                    userId,
                    productId: dto.product_id,
                },
                'Product not found or inactive',
            );

            throw new NotFoundException('Product not found');
        }

        const existingItem = await this.cartItemRepository.findOne({
            where: {
                cart_id: cart.id,
                product_id: product.id,
            },
        });

        const newQuantity = existingItem
            ? existingItem.quantity + dto.quantity
            : dto.quantity;

        if (newQuantity > product.stock) {
            this.logger.warn(
                {
                    userId,
                    productId: product.id,
                    requestedQuantity: newQuantity,
                    availableStock: product.stock,
                },
                'Cart quantity exceeds product stock',
            );

            throw new BadRequestException(
                `Only ${product.stock} items are available`,
            );
        }

        if (existingItem) {
            existingItem.quantity = newQuantity;

            await this.cartItemRepository.save(existingItem);
        } else {
            const cartItem = this.cartItemRepository.create({
                cart_id: cart.id,
                product_id: product.id,
                quantity: dto.quantity,
            });

            await this.cartItemRepository.save(cartItem);
        }

        this.logger.info(
            {
                userId,
                productId: product.id,
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
        const cart = await this.getCart(userId);

        const cartItem = await this.cartItemRepository.findOne({
            where: {
                id: itemId,
                cart_id: cart.id,
            },
        });

        if (!cartItem) {
            this.logger.warn(
                {
                    userId,
                    itemId,
                },
                'Cart item not found',
            );

            throw new NotFoundException('Cart item not found');
        }

        const product = await this.productRepository.findOne({
            where: {
                id: cartItem.product_id,
                is_active: true,
            },
        });

        if (!product) {
            this.logger.warn(
                {
                    userId,
                    itemId,
                    productId: cartItem.product_id,
                },
                'Product not found or inactive',
            );

            throw new NotFoundException('Product not found');
        }

        if (dto.quantity > product.stock) {
            this.logger.warn(
                {
                    userId,
                    itemId,
                    productId: product.id,
                    requestedQuantity: dto.quantity,
                    availableStock: product.stock,
                },
                'Cart quantity exceeds product stock',
            );

            throw new BadRequestException(
                `Only ${product.stock} items are available`,
            );
        }

        cartItem.quantity = dto.quantity;

        await this.cartItemRepository.save(cartItem);

        this.logger.info(
            {
                userId,
                itemId,
                productId: product.id,
                quantity: dto.quantity,
            },
            'Cart item quantity updated',
        );

        return this.getCart(userId);
    }
    async removeItem(userId: string, itemId: string): Promise<Cart> {
        const cart = await this.getCart(userId);

        const cartItem = await this.cartItemRepository.findOne({
            where: {
                id: itemId,
                cart_id: cart.id,
            },
        });

        if (!cartItem) {
            this.logger.warn(
                {
                    userId,
                    itemId,
                },
                'Cart item not found',
            );

            throw new NotFoundException('Cart item not found');
        }

        await this.cartItemRepository.remove(cartItem);

        this.logger.info(
            {
                userId,
                itemId,
                productId: cartItem.product_id,
            },
            'Cart item removed',
        );

        return this.getCart(userId);
    }
}

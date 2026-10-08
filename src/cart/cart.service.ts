import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private readonly cartRepository: Repository<Cart>,

        @InjectRepository(CartItem)
        private readonly cartItemRepository: Repository<CartItem>,

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

        return cart;
    }
}

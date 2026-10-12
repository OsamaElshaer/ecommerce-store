import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, Repository } from 'typeorm';

import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { CartService } from '../cart/cart.service';

import { Address } from '../addresses/entities/address.entity';
import { Product } from '../products/entities/product.entity';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,

        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,

        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,

        private readonly cartService: CartService,

        private readonly dataSource: DataSource,

        @InjectPinoLogger(OrdersService.name)
        private readonly logger: PinoLogger,
    ) {}

    async createOrder(userId: string, addressId: string): Promise<Order> {
        const order = await this.dataSource.transaction(async (manager) => {
            // 1. Lock the user's cart
            const cart = await manager.findOne(Cart, {
                where: {
                    user_id: userId,
                },
                lock: {
                    mode: 'pessimistic_write',
                },
            });

            if (!cart) {
                throw new BadRequestException('Your cart is empty');
            }

            // 2. Get cart items inside the transaction
            const cartItems = await manager.find(CartItem, {
                where: {
                    cart_id: cart.id,
                },
                order: {
                    product_id: 'ASC',
                },
            });

            if (cartItems.length === 0) {
                throw new BadRequestException('Your cart is empty');
            }

            // 3. Verify the shipping address belongs to the user
            const address = await manager.findOne(Address, {
                where: {
                    id: addressId,
                    user_id: userId,
                },
            });

            if (!address) {
                throw new NotFoundException('Shipping address not found');
            }

            let totalAmountInCents = 0;

            const orderItems: OrderItem[] = [];

            // 4. Lock products and reserve stock
            for (const cartItem of cartItems) {
                const product = await manager.findOne(Product, {
                    where: {
                        id: cartItem.product_id,
                        is_active: true,
                    },
                    lock: {
                        mode: 'pessimistic_write',
                    },
                });

                if (!product) {
                    throw new NotFoundException(
                        `Product ${cartItem.product_id} was not found or is inactive`,
                    );
                }

                if (cartItem.quantity > product.stock) {
                    throw new BadRequestException(
                        `Only ${product.stock} units of ${product.name} are available`,
                    );
                }

                // Convert the price to minor currency units
                const unitPriceInCents = Math.round(
                    Number(product.price) * 100,
                );

                totalAmountInCents += unitPriceInCents * cartItem.quantity;

                // Get product images separately
                const images = await manager
                    .createQueryBuilder()
                    .select('image.image_url', 'image_url')
                    .addSelect('image.is_primary', 'is_primary')
                    .addSelect('image.position', 'position')
                    .from('product_images', 'image')
                    .where('image.product_id = :productId', {
                        productId: product.id,
                    })
                    .orderBy('image.is_primary', 'DESC')
                    .addOrderBy('image.position', 'ASC')
                    .addOrderBy('image.created_at', 'ASC')
                    .getRawMany<{
                        image_url: string;
                        is_primary: boolean;
                        position: number;
                    }>();

                const productImage = images[0]?.image_url ?? null;

                // Reserve inventory within the transaction
                product.stock -= cartItem.quantity;

                await manager.save(Product, product);

                // Snapshot product information at purchase time
                orderItems.push(
                    manager.create(OrderItem, {
                        product_id: product.id,
                        quantity: cartItem.quantity,
                        unit_price: (unitPriceInCents / 100).toFixed(2),
                        product_name: product.name,
                        product_image: productImage,
                    }),
                );
            }

            // 5. Create the order with a shipping snapshot
            const newOrder = manager.create(Order, {
                user_id: userId,
                address_id: address.id,

                shipping_full_name: address.full_name,
                shipping_phone: address.phone,
                shipping_street: address.street,
                shipping_city: address.city,
                shipping_state: address.state,
                shipping_country: address.country,
                shipping_postal_code: address.postal_code,

                status: OrderStatus.PENDING,

                total_amount: (totalAmountInCents / 100).toFixed(2),
            });

            const savedOrder = await manager.save(Order, newOrder);

            // 6. Attach the order ID to each item
            for (const item of orderItems) {
                item.order_id = savedOrder.id;
            }

            await manager.save(OrderItem, orderItems);

            // 7. Clear the cart within the same transaction
            await manager.delete(CartItem, {
                cart_id: cart.id,
            });

            // 8. Return the order with its items
            return manager.findOneOrFail(Order, {
                where: {
                    id: savedOrder.id,
                },
                relations: {
                    items: true,
                },
            });
        });

        // This runs only after the transaction commits
        this.logger.info(
            {
                userId,
                orderId: order.id,
                totalAmount: order.total_amount,
            },
            'Order created successfully',
        );

        return order;
    }
}

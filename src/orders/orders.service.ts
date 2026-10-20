import {
    BadRequestException,
    HttpException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Address } from '../addresses/entities/address.entity';
import { Product } from '../products/entities/product.entity';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { QueryAdminOrdersDto } from './dto/query-admin-orders.dto';
import { ALLOWED_STATUS_TRANSITIONS } from './enums/order-status-transitions';

const EMPTY_CART_MESSAGE = 'Your cart is empty';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        private readonly dataSource: DataSource,

        @InjectPinoLogger(OrdersService.name)
        private readonly logger: PinoLogger,
    ) {}

    // ------------------------------------------------------------------
    // Create order
    // ------------------------------------------------------------------

    async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
        try {
            const order = await this.dataSource.transaction(
                async (manager): Promise<Order> => {
                    const { cart, cartItems } = await this.lockCartAndLoadItems(
                        manager,
                        userId,
                    );

                    const address = await this.getOwnedAddress(
                        manager,
                        userId,
                        dto.address_id,
                    );

                    const { orderItems, totalCents } =
                        await this.reserveStockAndBuildItems(
                            manager,
                            cartItems,
                        );

                    const savedOrder = await this.persistOrder(
                        manager,
                        userId,
                        address,
                        orderItems,
                        totalCents,
                    );

                    // Clear the cart atomically.
                    await manager.delete(CartItem, {
                        cart_id: cart.id,
                    });

                    // Return the order with its items.
                    return manager.findOneOrFail(Order, {
                        where: { id: savedOrder.id },
                        relations: { items: true },
                    });
                },
            );

            this.logger.info(
                {
                    userId,
                    orderId: order.id,
                    totalAmount: order.total_amount,
                },
                'Order created successfully',
            );

            return order;
        } catch (error) {
            this.logFailure('Order creation failed', { userId }, error);
            throw error;
        }
    }

    // Lock the user's cart and read its items in a consistent product order.
    // Cart mutations must lock this same row inside a transaction.
    private async lockCartAndLoadItems(
        manager: EntityManager,
        userId: string,
    ): Promise<{ cart: Cart; cartItems: CartItem[] }> {
        const cart = await manager.findOne(Cart, {
            where: { user_id: userId },
            lock: { mode: 'pessimistic_write' },
        });

        if (!cart) {
            throw new BadRequestException(EMPTY_CART_MESSAGE);
        }

        const cartItems = await manager.find(CartItem, {
            where: { cart_id: cart.id },
            order: { product_id: 'ASC' },
        });

        if (cartItems.length === 0) {
            throw new BadRequestException(EMPTY_CART_MESSAGE);
        }

        return { cart, cartItems };
    }

    // Verify that the shipping address belongs to the user.
    private async getOwnedAddress(
        manager: EntityManager,
        userId: string,
        addressId: string,
    ): Promise<Address> {
        const address = await manager.findOne(Address, {
            where: { id: addressId, user_id: userId },
        });

        if (!address) {
            throw new NotFoundException('Shipping address not found');
        }

        return address;
    }

    // Lock all products with ONE query, validate stock, reserve it,
    // and build the order items (with product snapshots).
    private async reserveStockAndBuildItems(
        manager: EntityManager,
        cartItems: CartItem[],
    ): Promise<{ orderItems: OrderItem[]; totalCents: number }> {
        const productIds = cartItems.map((item) => item.product_id);

        // One query for all products. Ordered by id to reduce deadlocks.
        const products = await manager.find(Product, {
            where: { id: In(productIds), is_active: true },
            order: { id: 'ASC' },
            lock: { mode: 'pessimistic_write' },
        });
        const productsById = new Map(products.map((p) => [p.id, p]));

        // One query for the primary image of every product.
        const imagesByProductId = await this.getPrimaryImages(
            manager,
            productIds,
        );

        let totalCents = 0;
        const orderItems: OrderItem[] = [];

        for (const cartItem of cartItems) {
            const product = productsById.get(cartItem.product_id);

            if (!product) {
                throw new NotFoundException(
                    `Product ${cartItem.product_id} not found or inactive`,
                );
            }

            if (cartItem.quantity > product.stock) {
                throw new BadRequestException(
                    `Only ${product.stock} units of ${product.name} are available`,
                );
            }

            // Convert price to minor currency units.
            const unitPriceCents = Math.round(Number(product.price) * 100);
            totalCents += unitPriceCents * cartItem.quantity;

            // Reserve stock with an atomic update.
            await this.decrementStock(manager, product, cartItem.quantity);

            // Snapshot product information at purchase time.
            orderItems.push(
                manager.create(OrderItem, {
                    product_id: product.id,
                    quantity: cartItem.quantity,
                    unit_price: (unitPriceCents / 100).toFixed(2),
                    product_name: product.name,
                    product_image: imagesByProductId.get(product.id) ?? null,
                }),
            );
        }

        return { orderItems, totalCents };
    }

    // Returns a Map of productId -> primary image url (one query).
    // Uses DISTINCT ON, which is PostgreSQL-specific.
    // src/orders/orders.service.ts
    private async getPrimaryImages(
        manager: EntityManager,
        productIds: string[],
    ): Promise<Map<string, string>> {
        if (productIds.length === 0) {
            return new Map();
        }

        const rows = await manager
            .createQueryBuilder()
            .select('image.product_id', 'product_id')
            .addSelect('image.image_url', 'image_url')
            .from('product_images', 'image')
            .where('image.product_id IN (:...productIds)', {
                productIds,
            })
            .distinctOn(['image.product_id'])
            .orderBy('image.product_id', 'ASC')
            .addOrderBy('image.is_primary', 'DESC')
            .addOrderBy('image.position', 'ASC')
            .addOrderBy('image.created_at', 'ASC')
            .getRawMany<{ product_id: string; image_url: string }>();

        return new Map(rows.map((row) => [row.product_id, row.image_url]));
    }
    // Check and decrement stock in a single statement.
    private async decrementStock(
        manager: EntityManager,
        product: Product,
        quantity: number,
    ): Promise<void> {
        const result = await manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock: () => 'stock - :qty' })
            .where('id = :id AND stock >= :qty', {
                id: product.id,
                qty: quantity,
            })
            .execute();

        if (result.affected === 0) {
            throw new BadRequestException(
                `Not enough stock for ${product.name}`,
            );
        }
    }

    // Create the order with a shipping address snapshot, then its items.
    private async persistOrder(
        manager: EntityManager,
        userId: string,
        address: Address,
        orderItems: OrderItem[],
        totalCents: number,
    ): Promise<Order> {
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
            total_amount: (totalCents / 100).toFixed(2),
        });

        const savedOrder = await manager.save(Order, newOrder);

        for (const item of orderItems) {
            item.order_id = savedOrder.id;
        }

        await manager.save(OrderItem, orderItems);

        return savedOrder;
    }

    // ------------------------------------------------------------------
    // Read orders
    // ------------------------------------------------------------------

    async findAll(userId: string, query: QueryOrdersDto) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const [orders, total] = await this.orderRepository.findAndCount({
            where: { user_id: userId },
            relations: { items: true },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(userId: string, orderId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
                user_id: userId,
            },
            relations: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // ------------------------------------------------------------------
    // Cancel order
    // ------------------------------------------------------------------

    async cancelOrder(userId: string, orderId: string): Promise<Order> {
        try {
            const cancelledOrder = await this.dataSource.transaction(
                async (manager): Promise<Order> => {
                    // 1. Lock the order to serialize concurrent cancellations.
                    const order = await manager.findOne(Order, {
                        where: { id: orderId, user_id: userId },
                        lock: { mode: 'pessimistic_write' },
                    });

                    if (!order) {
                        throw new NotFoundException('Order not found');
                    }

                    // 2. Only pending orders can be cancelled.
                    if (order.status !== OrderStatus.PENDING) {
                        throw new BadRequestException(
                            'Only pending orders can be cancelled',
                        );
                    }

                    // 3. Load order items in a consistent product order.
                    const items = await manager.find(OrderItem, {
                        where: { order_id: order.id },
                        order: { product_id: 'ASC' },
                    });

                    // 4. Restore stock inside the same transaction.
                    for (const item of items) {
                        // The product may have been deleted.
                        if (!item.product_id) {
                            this.logger.warn(
                                { orderId, itemId: item.id },
                                'Order item has no product, stock not restored',
                            );
                            continue;
                        }

                        const result = await manager
                            .createQueryBuilder()
                            .update(Product)
                            .set({ stock: () => 'stock + :qty' })
                            .where('id = :id', {
                                id: item.product_id,
                                qty: item.quantity,
                            })
                            .execute();

                        if (result.affected === 0) {
                            this.logger.warn(
                                { orderId, productId: item.product_id },
                                'Product not found, stock not restored',
                            );
                        }
                    }

                    // 5. Mark the order as cancelled.
                    order.status = OrderStatus.CANCELLED;
                    await manager.save(Order, order);

                    // 6. Return the updated order with its items.
                    return manager.findOneOrFail(Order, {
                        where: { id: order.id },
                        relations: { items: true },
                    });
                },
            );

            this.logger.info(
                { userId, orderId },
                'Order cancelled successfully',
            );

            return cancelledOrder;
        } catch (error) {
            this.logFailure(
                'Order cancellation failed',
                { userId, orderId },
                error,
            );
            throw error;
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    // Expected errors (400/404) are warnings, unexpected ones are errors.
    private logFailure(
        message: string,
        context: Record<string, unknown>,
        error: unknown,
    ): void {
        const reason = error instanceof Error ? error.message : String(error);

        if (error instanceof HttpException) {
            this.logger.warn({ ...context, reason }, message);
        } else {
            this.logger.error({ ...context, err: error }, message);
        }
    }

    async adminFindAll(query: QueryAdminOrdersDto) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        const [orders, total] = await this.orderRepository.findAndCount({
            where: status ? { status } : {},
            relations: { items: true },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // src/orders/orders.service.ts

    async updateStatus(
        orderId: string,
        newStatus: OrderStatus,
    ): Promise<Order> {
        const updatedOrder = await this.dataSource.transaction(
            async (manager): Promise<Order> => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] ?? [];

                if (!allowed.includes(newStatus)) {
                    throw new BadRequestException(
                        `Cannot change order status from ${order.status} to ${newStatus}`,
                    );
                }

                order.status = newStatus;
                await manager.save(Order, order);

                return manager.findOneOrFail(Order, {
                    where: { id: order.id },
                    relations: { items: true },
                });
            },
        );

        this.logger.info(
            { orderId, status: newStatus },
            'Order status updated',
        );

        return updatedOrder;
    }
}

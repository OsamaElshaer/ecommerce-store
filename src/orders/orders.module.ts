import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from '../cart/cart.module';
import { Address } from '../addresses/entities/address.entity';
import { Product } from '../products/entities/product.entity';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { CheckoutController } from './orders.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Address, Product]),
        CartModule,
    ],
    controllers: [CheckoutController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}

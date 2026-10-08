import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Product } from '../products/entities/product.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Cart, CartItem, Product])],
    controllers: [CartController],
    providers: [CartService],
})
export class CartModule {}

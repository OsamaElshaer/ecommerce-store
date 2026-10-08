import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
@Unique(['cart_id', 'product_id'])
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    cart_id!: string;

    @Column()
    product_id!: string;

    @Column({ type: 'int' })
    quantity!: number;

    @ManyToOne(() => Cart, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cart_id' })
    cart!: Cart;

    @ManyToOne(() => Product, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    order_id!: string;

    @ManyToOne(() => Order, (order) => order.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order!: Order;

    @Column({ type: 'uuid', nullable: true })
    product_id!: string | null;

    @ManyToOne(() => Product, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'product_id' })
    product!: Product | null;

    @Column({ type: 'int' })
    quantity!: number;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    unit_price!: string;

    @Column()
    product_name!: string;

    @Column({ type: 'varchar', nullable: true })
    product_image!: string | null;

}

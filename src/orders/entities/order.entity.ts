import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Address } from '../../addresses/entities/address.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    user_id!: string;

    @ManyToOne(() => User, (user) => user.orders, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'uuid', nullable: true })
    address_id!: string | null;

    @ManyToOne(() => Address, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({ name: 'address_id' })
    address!: Address | null;

    @Column()
    shipping_full_name!: string;

    @Column()
    shipping_phone!: string;

    @Column()
    shipping_street!: string;

    @Column()
    shipping_city!: string;

    @Column({ type: 'varchar', nullable: true })
    shipping_state!: string | null;

    @Column()
    shipping_country!: string;

    @Column({ type: 'varchar', nullable: true })
    shipping_postal_code!: string | null;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status!: OrderStatus;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    total_amount!: string;

    @OneToMany(() => OrderItem, (item) => item.order)
    items!: OrderItem[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity('payments')
@Index(
    'UQ_payments_order_id_idempotency_key',
    ['order_id', 'idempotency_key'],
    { unique: true },
)
@Index('UQ_payments_one_active_per_order', ['order_id'], {
    unique: true,
    where: `"status" IN ('pending', 'succeeded')`,
})
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    order_id!: string;

    @ManyToOne(() => Order, (order) => order.payments, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'order_id' })
    order!: Order;

    @Column({ type: 'varchar', length: 30 })
    provider!: string;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status!: PaymentStatus;

    @Column({ type: 'varchar', length: 255, nullable: true })
    transaction_ref!: string | null;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    amount!: string;

    @Column({ type: 'varchar', length: 3, default: 'EGP' })
    currency!: string;

    @Column({ type: 'varchar', length: 255 })
    idempotency_key!: string;

    @Column({ type: 'jsonb', nullable: true })
    client_data!: Record<string, unknown> | null;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

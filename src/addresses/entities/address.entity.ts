import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    user_id!: string;

    @ManyToOne(() => User, (user) => user.addresses, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column()
    full_name!: string;

    @Column()
    phone!: string;

    @Column()
    street!: string;

    @Column()
    city!: string;

    @Column({type: 'varchar', length: 255, nullable: true })
    state!: string | null;

    @Column()
    country!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    postal_code!: string | null;

    @Column({ default: false })
    is_default!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}

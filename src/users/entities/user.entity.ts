import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Address } from '../../addresses/entities/address.entity';

export enum UserRole {
    CUSTOMER = 'customer',
    ADMIN = 'admin',
}
export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
}
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    password_hash!: string | null;

    @Column()
    full_name!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role!: UserRole;

    @OneToMany(() => Address, (address) => address.user)
    addresses!: Address[];
    
    @Column({
        type: 'enum',
        enum: AuthProvider,
        default: AuthProvider.LOCAL,
    })
    auth_provider!: AuthProvider;

    @Column({ default: false })
    is_verified!: boolean;

    @CreateDateColumn()
    created_at!: Date;
}

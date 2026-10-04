import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price!: number;

    @Column({ type: 'int', default: 0 })
    stock!: number;

    @Column({ default: true })
    is_active!: boolean;

    @OneToMany(() => ProductImage, (image) => image.product)
    images!: ProductImage[];

    @CreateDateColumn()
    created_at!: Date;
}

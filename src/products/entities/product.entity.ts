import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    JoinColumn,
    ManyToOne,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { Category } from '../../categories/entities/category.entity';

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

    @Column()
    category_id!: string;

    @ManyToOne(() => Category, (category) => category.products)
    @JoinColumn({ name: 'category_id' })
    category!: Category;

    @OneToMany(() => ProductImage, (image) => image.product)
    images!: ProductImage[];

    @CreateDateColumn()
    created_at!: Date;
}

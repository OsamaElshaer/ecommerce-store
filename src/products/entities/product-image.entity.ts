import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    product_id!: string;

    @ManyToOne(() => Product, (product) => product.images, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'product_id' })
    product!: Product;

    @Column()
    image_url!: string;

    @Column({ default: false })
    is_primary!: boolean;

    @Column({ type: 'int', default: 0 })
    position!: number;

    @CreateDateColumn()
    created_at!: Date;
}

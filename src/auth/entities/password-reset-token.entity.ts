import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    selector!: string;

    @Column()
    token_hash!: string;

    @Column()
    user_id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ default: false })
    used!: boolean;

    @Column()
    expires_at!: Date;

    @CreateDateColumn()
    created_at!: Date;
}

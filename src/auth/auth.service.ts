import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { StringValue } from 'ms';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email already exists');
        }

        const password_hash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            email: dto.email,
            password_hash,
            full_name: dto.full_name,
        });

        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user.id, user.email, user.role);
    }

    private async generateTokens(userId: string, email: string, role: string) {
        // 1. Generate Access Token
        const access_token = this.jwtService.sign(
            {
                sub: userId,
                email,
                role,
            },
            {
                secret: this.configService.getOrThrow<string>('JWT_SECRET'),
                expiresIn:
                    this.configService.getOrThrow<StringValue>(
                        'JWT_EXPIRES_IN',
                    ),
            },
        );

        // 2. Generate Refresh Token
        const refresh_token = this.jwtService.sign(
            {
                sub: userId,
            },
            {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
                expiresIn: this.configService.getOrThrow<StringValue>(
                    'JWT_REFRESH_EXPIRES_IN',
                ),
            },
        );

        // 3. Hash Refresh Token before storing it in DB
        const token_hash = await bcrypt.hash(refresh_token, 10);

        // 4. Calculate Refresh Token expiration
        // هنا لازم تكون متوافقة مع JWT_REFRESH_EXPIRES_IN
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + 7);

        // 5. Store only the hash in DB
        await this.refreshTokenRepository.save({
            token_hash,
            user_id: userId,
            expires_at,
        });

        // 6. Return tokens to client
        return {
            access_token,
            refresh_token,
            user: {
                id: userId,
                email,
                role,
            },
        };
    }

    async refreshToken(token: string) {
        // 1. Verify Refresh Token signature + expiration
        let payload: { sub: string };

        try {
            payload = this.jwtService.verify<{ sub: string }>(token, {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // 2. Find the user
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        // 3. Get active refresh tokens for this user
        const storedTokens = await this.refreshTokenRepository.find({
            where: {
                user: {
                    id: user.id,
                },
                is_revoked: false,
            },
        });

        // 4. Compare the plain token with the stored hashes
        let matchedToken: RefreshToken | null = null;

        for (const stored of storedTokens) {
            const isMatch = await bcrypt.compare(token, stored.token_hash);

            if (isMatch) {
                matchedToken = stored;
                break;
            }
        }

        // 5. Token doesn't exist or expired in DB
        if (!matchedToken || matchedToken.expires_at.getTime() <= Date.now()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // 6. Revoke the old refresh token
        matchedToken.is_revoked = true;

        await this.refreshTokenRepository.save(matchedToken);

        // 7. Generate new Access Token + Refresh Token
        return this.generateTokens(user.id, user.email, user.role);
    }
}

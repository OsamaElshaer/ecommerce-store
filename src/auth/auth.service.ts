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

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
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

    private generateTokens(userId: string, email: string, role: string) {
        const access_token = this.jwtService.sign(
            { sub: userId, email, role },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
            },
        );

        const refresh_token = this.jwtService.sign(
            { sub: userId },
            {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
            },
        );

        return {
            access_token,
            refresh_token,
            user: { id: userId, email, role },
        };
    }

    async refreshToken(token: string) {
        let payload: { sub: string };

        try {
            payload = this.jwtService.verify(token, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }

        return this.generateTokens(user.id, user.email, user.role);
    }
}

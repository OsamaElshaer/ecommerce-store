import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { RefreshToken } from './entities/refresh-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenCleanupService } from './refresh-token-cleanup.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Module({
    imports: [
        UsersModule,
        JwtModule.register({}),
        PassportModule,
        TypeOrmModule.forFeature([RefreshToken, PasswordResetToken]),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, RefreshTokenCleanupService],
})
export class AuthModule {}

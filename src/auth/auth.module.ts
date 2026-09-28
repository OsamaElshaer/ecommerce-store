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
import { PasswordResetTokenCleanupService } from './password-reset-token-cleanup.service';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
    imports: [
        UsersModule,
        JwtModule.register({}),
        PassportModule,
        TypeOrmModule.forFeature([RefreshToken, PasswordResetToken, EmailVerificationToken]),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        RefreshTokenCleanupService,
        PasswordResetTokenCleanupService,
        GoogleStrategy,
    ],
})
export class AuthModule {}

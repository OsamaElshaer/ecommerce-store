import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import ms, { StringValue } from 'ms';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';
import { resetPasswordTemplate } from '../mail/templates/reset-password.template';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { emailVerificationTemplate } from '../mail/templates/email-verification.template';
import { AuthProvider, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        @InjectPinoLogger(AuthService.name)
        private readonly logger: PinoLogger,
        private readonly mailService: MailService,
        @InjectRepository(PasswordResetToken)
        private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
        @InjectRepository(EmailVerificationToken)
        private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    ) {}

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);

        if (existing) {
            this.logger.warn(
                { type: 'app', email: dto.email },
                'Registration attempt with existing email',
            );

            throw new ConflictException('Email already exists');
        }

        const password_hash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            email: dto.email,
            password_hash,
            full_name: dto.full_name,
        });

        const selector = randomBytes(16).toString('hex');
        const rawToken = randomBytes(32).toString('hex');

        const token_hash = await bcrypt.hash(rawToken, 10);

        const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.emailVerificationTokenRepository.save({
            selector,
            token_hash,
            user: { id: user.id },
            expires_at,
        });

        const verificationToken = `${selector}.${rawToken}`;

        const verificationUrl = `${this.configService.getOrThrow<string>(
            'FRONTEND_URL',
        )}/verify-email?token=${verificationToken}`;

        await this.mailService.sendEmail({
            to: user.email,
            subject: 'Verify your email',
            html: emailVerificationTemplate({
                name: user.full_name,
                verificationUrl,
            }),
        });

        this.logger.info(
            { type: 'app', userId: user.id },
            'New user registered — verification email sent',
        );

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
            this.logger.warn(
                { type: 'app', email: dto.email },
                'Failed login attempt — email not found',
            );
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.password_hash) {
            this.logger.warn(
                { type: 'app', userId: user.id },
                'This account was created with Google. Please use Google login or set a password first.',
            );

            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password_hash);

        if (!isMatch) {
            this.logger.warn(
                { type: 'app', userId: user.id },
                'Failed login attempt — wrong password',
            );
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.is_verified) {
            this.logger.warn(
                { type: 'app', userId: user.id },
                'Login attempt — email not verified',
            );
            throw new UnauthorizedException('Please verify your email first');
        }

        this.logger.info({ type: 'app', userId: user.id }, 'User logged in');

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

        // 2. Generate a random selector (non-secret, used for fast DB lookup)
        const selector = randomBytes(16).toString('hex');

        // 3. Generate Refresh Token
        const refresh_token = this.jwtService.sign(
            {
                sub: userId,
                selector,
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

        // 4. Hash Refresh Token before storing it in DB
        const token_hash = await bcrypt.hash(refresh_token, 10);

        // 5. Calculate Refresh Token expiration - JWT_REFRESH_EXPIRES_IN
        const refreshExpiresIn = this.configService.getOrThrow<StringValue>(
            'JWT_REFRESH_EXPIRES_IN',
        );
        const expires_at = new Date(Date.now() + ms(refreshExpiresIn));

        // 6. Store selector + hash in DB
        await this.refreshTokenRepository.save({
            selector,
            token_hash,
            user: {
                id: userId,
            },
            expires_at,
        });

        // 7. Return tokens to client
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
        let payload: { sub: string; selector: string };

        try {
            payload = this.jwtService.verify<{ sub: string; selector: string }>(
                token,
                {
                    secret: this.configService.getOrThrow<string>(
                        'JWT_REFRESH_SECRET',
                    ),
                },
            );
        } catch {
            this.logger.warn(
                { type: 'app', reason: 'invalid_signature_or_expired_jwt' },
                'Refresh token rejected',
            );
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // 2. Find the user
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            this.logger.warn(
                { type: 'app', userId: payload.sub },
                'Refresh token rejected — user no longer exists',
            );
            throw new UnauthorizedException('User no longer exists');
        }

        // 3. Find the exact stored token via selector
        const storedToken = await this.refreshTokenRepository.findOne({
            where: {
                selector: payload.selector,
                user: {
                    id: user.id,
                },
            },
        });

        // 4. Token not found
        if (!storedToken) {
            this.logger.warn(
                { type: 'app', userId: user.id, reason: 'unknown_selector' },
                'Refresh token rejected',
            );
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // 5. Reuse detection،
        if (storedToken.is_revoked) {
            await this.refreshTokenRepository.update(
                { user: { id: user.id } },
                { is_revoked: true },
            );

            this.logger.warn(
                { type: 'app', userId: user.id, selector: payload.selector },
                'Refresh token reuse detected — all sessions revoked',
            );

            throw new UnauthorizedException(
                'Token reuse detected. All sessions revoked.',
            );
        }

        // 6. Check expiration
        if (storedToken.expires_at.getTime() <= Date.now()) {
            this.logger.warn(
                { type: 'app', userId: user.id, reason: 'expired_in_db' },
                'Refresh token rejected',
            );
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // 7. Verify the hash matches (selector)
        const isMatch = await bcrypt.compare(token, storedToken.token_hash);
        if (!isMatch) {
            this.logger.warn(
                { type: 'app', userId: user.id, reason: 'hash_mismatch' },
                'Refresh token rejected',
            );
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // 8. Revoke the old refresh token (rotation)
        storedToken.is_revoked = true;
        await this.refreshTokenRepository.save(storedToken);

        this.logger.info(
            { type: 'app', userId: user.id },
            'Refresh token rotated',
        );

        // 9. Generate new Access Token + Refresh Token
        return this.generateTokens(user.id, user.email, user.role);
    }

    async logout(userId: string, token: string) {
        let payload: { selector: string };

        try {
            payload = this.jwtService.verify<{ selector: string }>(token, {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
            });
        } catch {
            return { message: 'Logged out' };
        }

        await this.refreshTokenRepository.update(
            { user: { id: userId }, selector: payload.selector },
            { is_revoked: true },
        );

        this.logger.info({ type: 'app', userId }, 'User logged out');

        return { message: 'Logged out' };
    }
    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);

        if (user) {
            const selector = randomBytes(16).toString('hex');
            const rawToken = randomBytes(32).toString('hex');
            const token_hash = await bcrypt.hash(rawToken, 10);

            const expires_at = new Date(Date.now() + 60 * 60 * 1000);

            await this.passwordResetTokenRepository.save({
                selector,
                token_hash,
                user: { id: user.id },
                expires_at,
            });

            const resetToken = `${selector}.${rawToken}`;
            const resetUrl = `${this.configService.getOrThrow<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

            await this.mailService.sendEmail({
                to: user.email,
                subject: 'Reset your password',
                html: resetPasswordTemplate({
                    name: user.full_name,
                    resetUrl,
                }),
            });

            this.logger.info(
                { type: 'app', userId: user.id },
                'Password reset link sent',
            );
        } else {
            this.logger.warn(
                { type: 'app', email },
                'Password reset requested for unknown email',
            );
        }

        return {
            message:
                'If an account with this email exists, a password reset link has been sent.',
        };
    }
    async resetPassword(token: string, newPassword: string) {
        const [selector, rawToken] = token.split('.');

        if (!selector || !rawToken) {
            throw new BadRequestException('Invalid reset token');
        }

        const resetToken = await this.passwordResetTokenRepository.findOne({
            where: { selector },
            relations: {
                user: true,
            },
        });
        if (!resetToken) {
            throw new BadRequestException('Invalid reset token');
        }

        if (resetToken.used) {
            throw new BadRequestException('Reset token has already been used');
        }

        if (resetToken.expires_at < new Date()) {
            throw new BadRequestException('Reset token has expired');
        }

        const isValid = await bcrypt.compare(rawToken, resetToken.token_hash);

        if (!isValid) {
            throw new BadRequestException('Invalid reset token');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await this.usersService.update(resetToken.user.id, {
            password_hash: passwordHash,
        });
        resetToken.used = true;

        await this.passwordResetTokenRepository.save(resetToken);

        return {
            message: 'Password reset successfully',
        };
    }
    async verifyEmail(token: string) {
        const [selector, rawToken] = token.split('.');

        if (!selector || !rawToken) {
            throw new BadRequestException('Invalid verification token');
        }

        const verificationToken =
            await this.emailVerificationTokenRepository.findOne({
                where: { selector },
                relations: {
                    user: true,
                },
            });

        if (!verificationToken) {
            throw new BadRequestException('Invalid verification token');
        }

        if (verificationToken.used) {
            throw new BadRequestException(
                'Verification token has already been used',
            );
        }

        if (verificationToken.expires_at < new Date()) {
            throw new BadRequestException('Verification token has expired');
        }

        const isValid = await bcrypt.compare(
            rawToken,
            verificationToken.token_hash,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid verification token');
        }

        await this.usersService.update(verificationToken.user.id, {
            is_verified: true,
        });

        verificationToken.used = true;

        await this.emailVerificationTokenRepository.save(verificationToken);

        this.logger.info(
            { type: 'app', userId: verificationToken.user.id },
            'Email verified successfully',
        );

        return {
            message: 'Email verified successfully',
        };
    }
    async resendVerification(email: string) {
        const user = await this.usersService.findByEmail(email);

        const genericMessage = {
            message:
                'If an account with this email exists, a verification email has been sent.',
        };

        if (!user || user.is_verified) {
            return genericMessage;
        }

        await this.emailVerificationTokenRepository.update(
            {
                user: { id: user.id },
                used: false,
            },
            {
                used: true,
            },
        );

        const selector = randomBytes(16).toString('hex');
        const rawToken = randomBytes(32).toString('hex');

        const token_hash = await bcrypt.hash(rawToken, 10);

        const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.emailVerificationTokenRepository.save({
            selector,
            token_hash,
            user: { id: user.id },
            expires_at,
        });

        const verificationToken = `${selector}.${rawToken}`;

        const verificationUrl = `${this.configService.getOrThrow<string>(
            'FRONTEND_URL',
        )}/verify-email?token=${verificationToken}`;

        await this.mailService.sendEmail({
            to: user.email,
            subject: 'Verify your email',
            html: emailVerificationTemplate({
                name: user.full_name,
                verificationUrl,
            }),
        });

        this.logger.info(
            { type: 'app', userId: user.id },
            'Verification email resent',
        );

        return genericMessage;
    }
    async googleLogin(profile: { email: string; fullName: string }) {
        const user = await this.usersService.findByEmail(profile.email);

        // Existing user
        if (user) {
            if (user.auth_provider !== AuthProvider.GOOGLE) {
                this.logger.warn(
                    {
                        type: 'app',
                        email: profile.email,
                        userId: user.id,
                    },
                    'Google login rejected — local account exists',
                );

                throw new UnauthorizedException(
                    'An account with this email already exists. Please log in with your password.',
                );
            }

            this.logger.info(
                {
                    type: 'app',
                    userId: user.id,
                },
                'User logged in with Google',
            );

            return this.generateTokens(user.id, user.email, user.role);
        }

        // New Google user
        const newUser = await this.usersService.create({
            email: profile.email,
            full_name: profile.fullName,
            password_hash: null,
            role: UserRole.CUSTOMER,
            auth_provider: AuthProvider.GOOGLE,
            is_verified: true,
        });

        this.logger.info(
            {
                type: 'app',
                userId: newUser.id,
            },
            'User registered with Google',
        );

        return this.generateTokens(newUser.id, newUser.email, newUser.role);
    }
}

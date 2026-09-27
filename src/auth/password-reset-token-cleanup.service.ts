import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokenCleanupService {
    constructor(
        @InjectRepository(PasswordResetToken)
        private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,

        @InjectPinoLogger(PasswordResetTokenCleanupService.name)
        private readonly logger: PinoLogger,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupExpiredTokens() {
        const result = await this.passwordResetTokenRepository.delete({
            expires_at: LessThanOrEqual(new Date()),
        });

        this.logger.info(
            { type: 'app', deletedCount: result.affected ?? 0 },
            'Expired password reset tokens cleaned up',
        );
    }
}

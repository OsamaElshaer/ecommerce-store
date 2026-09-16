import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class RefreshTokenCleanupService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        @InjectPinoLogger(RefreshTokenCleanupService.name)
        private readonly logger: PinoLogger,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupExpiredTokens() {
        const result = await this.refreshTokenRepository.delete({
            expires_at: LessThanOrEqual(new Date()),
        });

        this.logger.info(
            { type: 'app', deletedCount: result.affected ?? 0 },
            'Expired refresh tokens cleaned up',
        );
    }
}

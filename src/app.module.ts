import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                autoLogging: false,
                quietReqLogger: true,
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                              target: 'pino-pretty',
                              options: {
                                  colorize: true,
                              },
                          }
                        : undefined,

                level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',

                customProps: () => ({
                    type: 'http',
                }),

                redact: {
                    paths: [
                        'req.headers.authorization',
                        'req.body.password',
                        'req.body.refresh_token',
                        'req.headers.cookie',
                    ],
                    censor: '[REDACTED]',
                },
            },
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envValidationSchema,
            envFilePath: '.env.dev',
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('POSTGRES_HOST'),
                port: config.get<number>('POSTGRES_PORT'),
                username: config.get<string>('POSTGRES_USER'),
                password: config.get<string>('POSTGRES_PASSWORD'),
                database: config.get<string>('POSTGRES_DB'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: config.get<string>('NODE_ENV') === 'development',
            }),
        }),
        ScheduleModule.forRoot(),

        HealthModule,
        UsersModule,
        AuthModule,
        MailModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}

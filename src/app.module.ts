import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: envValidationSchema,
            validationOptions: {
                abortEarly: false, 
            },
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}

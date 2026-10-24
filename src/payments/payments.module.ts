import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentProvider } from './interface/payment-gateway.interface';
import { PaymobProvider } from './gateways/paymob.gateway';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsWebhookController } from './payments-webhook.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Payment, Order])],
    controllers: [PaymentsController, PaymentsWebhookController],
    providers: [
        PaymobProvider,
        PaymentsService,
        {
            provide: PaymentProvider,
            useFactory: (
                config: ConfigService,
                paymob: PaymobProvider,
            ): PaymentProvider => {
                const name = config.getOrThrow<string>('PAYMENT_PROVIDER');

                switch (name) {
                    case 'paymob':
                        return paymob;
                    default:
                        throw new Error(
                            `Unsupported PAYMENT_PROVIDER: ${name}`,
                        );
                }
            },
            inject: [ConfigService, PaymobProvider],
        },
    ],
    exports: [PaymentsService],
})
export class PaymentsModule {}

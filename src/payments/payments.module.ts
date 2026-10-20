import { Module } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { PAYMENT_GATEWAY } from './constants/payment.constants';
import { PAYMENT_PROVIDER_CLASSES } from './constants/payment-providers';
import { PaymentProvider } from './interface/payment-gateway.interface';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Payment,Order])],

    providers: [
        ...PAYMENT_PROVIDER_CLASSES,
        PaymentsService,
        {
            provide: PAYMENT_GATEWAY,
            useFactory: (...providers: PaymentProvider[]) => providers,
            inject: PAYMENT_PROVIDER_CLASSES,
        },
    ],
    exports: [PaymentsService],
    controllers: [PaymentsController],
})
export class PaymentsModule {}

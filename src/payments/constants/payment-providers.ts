import { Type } from '@nestjs/common';

import { PaymentProvider } from '../interface/payment-gateway.interface';
import { PaymobProvider } from '../gateways/paymob.gateway';
import { StripeProvider } from '../gateways/stripe.gateway';

export const PAYMENT_PROVIDER_CLASSES: Type<PaymentProvider>[] = [
    PaymobProvider,
    StripeProvider,
];

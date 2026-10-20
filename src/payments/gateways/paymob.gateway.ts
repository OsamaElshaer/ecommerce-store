import { Injectable } from '@nestjs/common';

import {
    PaymentProvider,
    CreatePaymentInput,
    CreatePaymentResult,
    PaymentEvent,
} from '../interface/payment-gateway.interface';

@Injectable()
export class PaymobProvider extends PaymentProvider {
    readonly name = 'paymob';

    async createPayment(
        input: CreatePaymentInput,
    ): Promise<CreatePaymentResult> {
        // TODO: Call Paymob API

        console.log('Creating Paymob payment:', input.orderId);

        return {
            providerRef: 'paymob-tx-123',
            clientData: {
                paymentUrl: 'https://example.com/pay',
            },
        };
    }

    async parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>,
    ): Promise<PaymentEvent | null> {
        // TODO:
        // 1. Verify Paymob signature.
        // 2. Parse the event.
        // 3. Map it to PaymentEvent.

        throw new Error('Paymob webhook verification not implemented');
    }
}

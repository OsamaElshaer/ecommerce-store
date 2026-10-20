import { Injectable } from '@nestjs/common';

import {
    PaymentProvider,
    CreatePaymentInput,
    CreatePaymentResult,
    PaymentEvent,
} from '../interface/payment-gateway.interface';

@Injectable()
export class StripeProvider extends PaymentProvider {
    readonly name = 'stripe';

    async createPayment(
        input: CreatePaymentInput,
    ): Promise<CreatePaymentResult> {
        // TODO: Call Stripe API

        console.log('Creating Stripe payment:', input.orderId);

        return {
            providerRef: 'stripe-tx-123',
            clientData: {
                clientSecret: 'test_client_secret',
            },
        };
    }

    async parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>,
    ): Promise<PaymentEvent | null> {
        // TODO: Verify Stripe signature and parse event

        throw new Error('Stripe webhook verification not implemented');
    }
}

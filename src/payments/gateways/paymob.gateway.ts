import { createHmac, timingSafeEqual } from 'node:crypto';
import {
    BadGatewayException,
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import {
    PaymentProvider,
    CreatePaymentInput,
    CreatePaymentResult,
    PaymentEvent,
    WebhookRequest,
} from '../interface/payment-gateway.interface';

const CHECKOUT_BASE_URL = 'https://eg.checkout.paymob.com';

interface PaymobIntentionResponse {
    client_secret?: string;
    intention_order_id?: number;
}

interface PaymobTransaction {
    id: number;
    pending: boolean;
    success: boolean;
    amount_cents: number;
    created_at: string;
    currency: string;
    error_occured: boolean;
    has_parent_transaction: boolean;
    integration_id: number;
    is_3d_secure: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_refunded: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    owner: number;
    order: { id: number };
    source_data: { pan: string; sub_type: string; type: string };
}

interface PaymobWebhookBody {
    type?: string;
    obj?: PaymobTransaction;
}

@Injectable()
export class PaymobProvider extends PaymentProvider {
    readonly name = 'paymob';

    constructor(
        private readonly config: ConfigService,

        @InjectPinoLogger(PaymobProvider.name)
        private readonly logger: PinoLogger,
    ) {
        super();
    }

    async createPayment(
        input: CreatePaymentInput,
    ): Promise<CreatePaymentResult> {
        const baseUrl = this.config
            .getOrThrow<string>('PAYMOB_BASE_URL')
            .replace(/\/$/, '');
        const secretKey = this.config.getOrThrow<string>('PAYMOB_SECRET_KEY');
        const publicKey = this.config.getOrThrow<string>('PAYMOB_PUBLIC_KEY');
        const integrationId = Number(
            this.config.getOrThrow('PAYMOB_INTEGRATION_ID'),
        );
        const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
        const apiPublicUrl = this.config
            .getOrThrow<string>('API_PUBLIC_URL')
            .replace(/\/$/, '');
        // Paymob expects the amount in cents (piasters).
        const amountCents = Math.round(Number(input.amount) * 100);

        const [firstName, ...rest] = input.customerName.trim().split(/\s+/);
        const lastName = rest.join(' ') || 'NA';

        let response: Response;

        try {
            response = await fetch(`${baseUrl}/v1/intention/`, {
                method: 'POST',
                headers: {
                    Authorization: `Token ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amountCents,
                    currency: input.currency,
                    payment_methods: [integrationId],
                    items: [
                        {
                            name: `Order ${input.orderId.slice(0, 8)}`,
                            amount: amountCents,
                            description: 'Order payment',
                            quantity: 1,
                        },
                    ],
                    billing_data: {
                        first_name: firstName || 'NA',
                        last_name: lastName,
                        email: input.customerEmail,
                        phone_number: input.customerPhone,
                    },
                    special_reference: input.paymentId,
                    redirection_url: `${frontendUrl}/orders/${input.orderId}`,
                    notification_url: `${apiPublicUrl}/payments/webhook`,
                }),
                signal: AbortSignal.timeout(10_000),
            });
        } catch (error) {
            this.logger.error(
                { err: error, orderId: input.orderId },
                'Paymob request failed',
            );
            throw new BadGatewayException('Payment provider is unavailable');
        }

        if (!response.ok) {
            const body = await response.text();

            this.logger.error(
                { status: response.status, body, orderId: input.orderId },
                'Paymob rejected the payment intention',
            );
            throw new BadGatewayException(
                'Payment provider rejected the request',
            );
        }

        const data = (await response.json()) as PaymobIntentionResponse;

        if (!data.client_secret || data.intention_order_id === undefined) {
            this.logger.error(
                { orderId: input.orderId },
                'Paymob response is missing client_secret or intention_order_id',
            );
            throw new BadGatewayException(
                'Invalid response from payment provider',
            );
        }

        const checkoutUrl =
            `${CHECKOUT_BASE_URL}/?publicKey=${encodeURIComponent(publicKey)}` +
            `&clientSecret=${encodeURIComponent(data.client_secret)}`;

        return {
            providerRef: String(data.intention_order_id),
            clientData: {
                checkoutUrl,
                clientSecret: data.client_secret,
            },
        };
    }

    async parseWebhook(request: WebhookRequest): Promise<PaymentEvent | null> {
        const body = request.body as PaymobWebhookBody | undefined;
        const obj = body?.obj;

        // Paymob also sends other callback types (e.g. card tokens).
        if (body?.type !== 'TRANSACTION' || !obj) {
            return null;
        }

        const receivedHmac = request.query.hmac?.toLowerCase();

        if (!receivedHmac) {
            throw new BadRequestException('Missing signature');
        }

        // Field order is defined by Paymob's HMAC documentation.
        const concatenated = [
            obj.amount_cents,
            obj.created_at,
            obj.currency,
            obj.error_occured,
            obj.has_parent_transaction,
            obj.id,
            obj.integration_id,
            obj.is_3d_secure,
            obj.is_auth,
            obj.is_capture,
            obj.is_refunded,
            obj.is_standalone_payment,
            obj.is_voided,
            obj.order?.id,
            obj.owner,
            obj.pending,
            obj.source_data?.pan,
            obj.source_data?.sub_type,
            obj.source_data?.type,
            obj.success,
        ]
            .map((value) => String(value ?? ''))
            .join('');

        const expectedHmac = createHmac(
            'sha512',
            this.config.getOrThrow<string>('PAYMOB_HMAC_SECRET'),
        )
            .update(concatenated)
            .digest('hex');

        const isValid =
            expectedHmac.length === receivedHmac.length &&
            timingSafeEqual(
                Buffer.from(expectedHmac),
                Buffer.from(receivedHmac),
            );

        if (!isValid) {
            this.logger.warn(
                { transactionId: obj.id },
                'Invalid Paymob signature',
            );
            throw new BadRequestException('Invalid signature');
        }

        // Not a final payment result (refunds and voids are handled later).
        if (obj.pending || obj.is_voided || obj.is_refunded) {
            return null;
        }

        return {
            providerRef: String(obj.order.id),
            status: obj.success ? 'succeeded' : 'failed',
            amountCents: obj.amount_cents,
            currency: obj.currency,
        };
    }
}

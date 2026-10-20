export interface CreatePaymentInput {
    orderId: string;
    amount: string;
    currency: string;
    customerEmail: string;
    idempotencyKey: string;
}

export interface CreatePaymentResult {
    providerRef: string;
    clientData: Record<string, unknown>;
}

export interface PaymentEvent {
    providerRef: string;
    status: 'succeeded' | 'failed';
}

export abstract class PaymentProvider {
    abstract readonly name: string;

    abstract createPayment(
        input: CreatePaymentInput,
    ): Promise<CreatePaymentResult>;

    abstract parseWebhook(
        rawBody: Buffer,
        headers: Record<string, string | string[] | undefined>,
    ): Promise<PaymentEvent | null>;
}

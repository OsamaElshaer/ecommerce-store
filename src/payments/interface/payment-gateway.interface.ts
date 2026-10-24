export interface CreatePaymentInput {
    paymentId: string;
    orderId: string;
    amount: string;
    currency: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    idempotencyKey: string;
}

export interface CreatePaymentResult {
    providerRef: string;
    clientData: Record<string, unknown>;
}

export interface PaymentEvent {
    providerRef: string;
    status: 'succeeded' | 'failed';
    amountCents: number;
    currency: string;
}
export interface WebhookRequest {
    body: unknown;
    query: Record<string, string | undefined>;
    headers: Record<string, string | string[] | undefined>;
}
export abstract class PaymentProvider {
    abstract readonly name: string;

    abstract createPayment(
        input: CreatePaymentInput,
    ): Promise<CreatePaymentResult>;

    // Verifies the gateway signature (throws BadRequestException if invalid)
    // and returns null for events we don't act on.
    abstract parseWebhook(
        request: WebhookRequest,
    ): Promise<PaymentEvent | null>;
}

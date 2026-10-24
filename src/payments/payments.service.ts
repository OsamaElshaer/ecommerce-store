import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';

import {
    PaymentProvider,
    CreatePaymentInput,
    CreatePaymentResult,
    WebhookRequest,
} from './interface/payment-gateway.interface';

import { Payment } from './entities/payment.entity';
import { PaymentStatus } from './enums/payment-status.enum';

import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly provider: PaymentProvider,

        @InjectPinoLogger(PaymentsService.name)
        private readonly logger: PinoLogger,

        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        private readonly dataSource: DataSource,
    ) {}

    async createPayment(
        userId: string,
        orderId: string,
        idempotencyKey: string,
    ): Promise<CreatePaymentResult> {
        const normalizedKey = idempotencyKey.trim();

        if (!normalizedKey) {
            throw new BadRequestException('Idempotency-Key header is required');
        }

        const order = await this.orderRepository.findOne({
            where: { id: orderId, user_id: userId },
            relations: { user: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new ConflictException(
                'Payment can only be created for pending orders',
            );
        }

        const existingPayment = await this.paymentRepository.findOne({
            where: { order_id: order.id, idempotency_key: normalizedKey },
        });

        if (existingPayment) {
            if (
                existingPayment.status === PaymentStatus.PENDING &&
                existingPayment.transaction_ref &&
                existingPayment.client_data
            ) {
                return {
                    providerRef: existingPayment.transaction_ref,
                    clientData: existingPayment.client_data,
                };
            }

            throw new ConflictException(
                'A payment attempt already exists for this key. Use a new key for a new attempt.',
            );
        }

        const activePayment = await this.paymentRepository.findOne({
            where: {
                order_id: order.id,
                status: In([PaymentStatus.PENDING, PaymentStatus.SUCCEEDED]),
            },
        });

        if (activePayment) {
            if (activePayment.status === PaymentStatus.SUCCEEDED) {
                throw new ConflictException('This order is already paid');
            }

            if (activePayment.transaction_ref && activePayment.client_data) {
                return {
                    providerRef: activePayment.transaction_ref,
                    clientData: activePayment.client_data,
                };
            }

            throw new ConflictException(
                'A payment for this order is already in progress, try again shortly',
            );
        }

        const payment = this.paymentRepository.create({
            order_id: order.id,
            order,
            provider: this.provider.name,
            status: PaymentStatus.PENDING,
            transaction_ref: null,
            amount: order.total_amount,
            currency: 'EGP',
            idempotency_key: normalizedKey,
            client_data: null,
        });

        try {
            await this.paymentRepository.save(payment);
        } catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new ConflictException(
                    'A payment for this order is already in progress, try again shortly',
                );
            }
            throw error;
        }

        const input: CreatePaymentInput = {
            paymentId: payment.id,
            orderId: order.id,
            amount: order.total_amount,
            currency: 'EGP',
            customerEmail: order.user.email,
            customerName: order.shipping_full_name,
            customerPhone: order.shipping_phone,
            idempotencyKey: normalizedKey,
        };

        this.logger.info(
            {
                orderId: order.id,
                paymentId: payment.id,
                provider: this.provider.name,
            },
            'Creating payment',
        );

        try {
            const result = await this.provider.createPayment(input);

            payment.transaction_ref = result.providerRef;
            payment.client_data = result.clientData;

            await this.paymentRepository.save(payment);

            this.logger.info(
                {
                    orderId: order.id,
                    paymentId: payment.id,
                    provider: this.provider.name,
                },
                'Payment session created',
            );

            return result;
        } catch (error) {
            this.logger.error(
                {
                    err: error,
                    orderId: order.id,
                    paymentId: payment.id,
                    provider: this.provider.name,
                },
                'Payment creation failed',
            );

            payment.status = PaymentStatus.FAILED;
            await this.paymentRepository.save(payment);

            throw error;
        }
    }

    async handleWebhook(request: WebhookRequest): Promise<void> {
        const event = await this.provider.parseWebhook(request);

        if (!event) {
            this.logger.info('Webhook ignored');
            return;
        }

        if (event.status === 'failed') {
            // The customer may retry on the same checkout page,
            // so the payment stays pending.
            this.logger.warn(
                {
                    provider: this.provider.name,
                    providerRef: event.providerRef,
                },
                'Payment attempt failed at the provider',
            );
            return;
        }

        await this.dataSource.transaction(async (manager) => {
            const payment = await manager.findOne(Payment, {
                where: {
                    provider: this.provider.name,
                    transaction_ref: event.providerRef,
                },
                lock: { mode: 'pessimistic_write' },
            });

            if (!payment) {
                this.logger.warn(
                    { providerRef: event.providerRef },
                    'Webhook received for an unknown payment',
                );
                return;
            }

            // Providers can deliver the same webhook more than once.
            if (payment.status === PaymentStatus.SUCCEEDED) {
                this.logger.info(
                    { paymentId: payment.id },
                    'Webhook already processed',
                );
                return;
            }

            const expectedCents = Math.round(Number(payment.amount) * 100);

            if (
                event.amountCents !== expectedCents ||
                event.currency !== payment.currency
            ) {
                this.logger.error(
                    {
                        paymentId: payment.id,
                        expectedCents,
                        receivedCents: event.amountCents,
                        expectedCurrency: payment.currency,
                        receivedCurrency: event.currency,
                    },
                    'Webhook amount mismatch, payment not confirmed',
                );
                return;
            }

            payment.status = PaymentStatus.SUCCEEDED;
            await manager.save(Payment, payment);

            const order = await manager.findOne(Order, {
                where: { id: payment.order_id },
                lock: { mode: 'pessimistic_write' },
            });

            if (order && order.status === OrderStatus.PENDING) {
                order.status = OrderStatus.CONFIRMED;
                await manager.save(Order, order);

                this.logger.info(
                    { paymentId: payment.id, orderId: order.id },
                    'Payment confirmed and order marked as confirmed',
                );
            } else {
                this.logger.error(
                    {
                        paymentId: payment.id,
                        orderId: payment.order_id,
                        orderStatus: order?.status,
                    },
                    'Payment succeeded but the order is not pending, a refund may be needed',
                );
            }
        });
    }

    private isUniqueViolation(error: unknown): boolean {
        return (
            error instanceof QueryFailedError &&
            (error.driverError as { code?: string })?.code === '23505'
        );
    }
}

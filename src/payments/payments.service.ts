import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    PaymentProvider,
    CreatePaymentInput,
    CreatePaymentResult,
} from './interface/payment-gateway.interface';

import { PAYMENT_GATEWAY } from './constants/payment.constants';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from './enums/payment-status.enum';

import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';

@Injectable()
export class PaymentsService {
    private readonly providersMap: Map<string, PaymentProvider>;

    constructor(
        @Inject(PAYMENT_GATEWAY)
        providers: PaymentProvider[],

        @InjectPinoLogger(PaymentsService.name)
        private readonly logger: PinoLogger,

        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) {
        this.providersMap = new Map(
            providers.map((provider) => [
                provider.name.trim().toLowerCase(),
                provider,
            ]),
        );
    }

    async createPayment(
        userId: string,
        providerName: string,
        orderId: string,
        idempotencyKey: string,
    ): Promise<CreatePaymentResult> {
        const normalizedProviderName = providerName.trim().toLowerCase();
        const normalizedKey = idempotencyKey.trim();

        if (!normalizedKey) {
            throw new BadRequestException('Idempotency-Key header is required');
        }

        const provider = this.providersMap.get(normalizedProviderName);

        if (!provider) {
            throw new BadRequestException(
                `Unsupported payment provider: ${normalizedProviderName}`,
            );
        }

        const order = await this.orderRepository.findOne({
            where: {
                id: orderId,
                user_id: userId,
            },
            relations: {
                user: true,
            },
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
            where: {
                order_id: order.id,
                idempotency_key: normalizedKey,
            },
        });

        if (existingPayment) {
            if (existingPayment.provider !== normalizedProviderName) {
                throw new ConflictException(
                    'Idempotency-Key was already used with another provider',
                );
            }

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

        const payment = this.paymentRepository.create({
            order_id: order.id,
            order,
            provider: normalizedProviderName,
            status: PaymentStatus.PENDING,
            transaction_ref: null,
            amount: order.total_amount,
            currency: 'EGP',
            idempotency_key: normalizedKey,
            client_data: null,
        });

        await this.paymentRepository.save(payment);

        const input: CreatePaymentInput = {
            orderId: order.id,
            amount: order.total_amount,
            currency: 'EGP',
            customerEmail: order.user.email,
            idempotencyKey: normalizedKey,
        };

        this.logger.info(
            {
                orderId: order.id,
                paymentId: payment.id,
                providerName: normalizedProviderName,
            },
            'Creating payment',
        );

        try {
            const result = await provider.createPayment(input);

            payment.transaction_ref = result.providerRef;
            payment.client_data = result.clientData;

            await this.paymentRepository.save(payment);

            this.logger.info(
                {
                    orderId: order.id,
                    paymentId: payment.id,
                    providerName: normalizedProviderName,
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
                    providerName: normalizedProviderName,
                },
                'Payment creation failed',
            );

            payment.status = PaymentStatus.FAILED;
            await this.paymentRepository.save(payment);

            throw error;
        }
    }
}

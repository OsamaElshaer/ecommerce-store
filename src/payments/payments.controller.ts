import {
    BadRequestException,
    Body,
    Controller,
    Headers,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiHeader,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post(':providerName')
    @ApiOperation({ summary: 'Create a payment' })
    @ApiParam({
        name: 'providerName',
        enum: ['paymob', 'stripe'],
        example: 'paymob',
    })
    @ApiHeader({
        name: 'Idempotency-Key',
        description:
            'Unique key for this payment attempt; reuse it when retrying the same request',
        required: true,
        example: '8f14e45f-ea3b-41d4-a716-446655440000',
    })
    @ApiBadRequestResponse({
        description: 'Invalid request or missing Idempotency-Key',
    })
    createPayment(
        @Req() req: any,
        @Param('providerName') providerName: string,
        @Headers('idempotency-key') idempotencyKey: string | undefined,
        @Body() dto: CreatePaymentDto,
    ) {
        if (!idempotencyKey?.trim()) {
            throw new BadRequestException('Idempotency-Key header is required');
        }

        return this.paymentsService.createPayment(
            req.user.id,
            providerName,
            dto.orderId,
            idempotencyKey.trim(),
        );
    }
}

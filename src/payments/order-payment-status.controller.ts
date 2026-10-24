import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderPaymentStatusController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Get(':id/payment-status')
    @ApiOperation({ summary: 'Get the payment status of one of my orders' })
    getPaymentStatus(
        @Req() req: any,
        @Param('id', ParseUUIDPipe) orderId: string,
    ) {
        return this.paymentsService.getPaymentStatus(req.user.id, orderId);
    }
}

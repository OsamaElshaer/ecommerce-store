import {
    Body,
    Controller,
    Headers,
    HttpCode,
    Post,
    Query,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { PaymentsService } from './payments.service';

@ApiExcludeController()
@Controller('payments')
export class PaymentsWebhookController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('webhook')
    @HttpCode(200)
    async handle(
        @Body() body: unknown,
        @Query() query: Record<string, string | undefined>,
        @Headers() headers: Record<string, string | string[] | undefined>,
    ) {
        await this.paymentsService.handleWebhook({ body, query, headers });
        return { received: true };
    }
}

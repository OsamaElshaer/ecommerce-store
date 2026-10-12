import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Checkout')
@ApiBearerAuth()
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @ApiOperation({
        summary: 'Create an order from the current cart',
    })
    @ApiResponse({
        status: 201,
        description: 'Order created successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cart is empty or stock is insufficient',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 404,
        description: 'Shipping address or product not found',
    })
    async checkout(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.createOrder(req.user.id, dto.address_id);
    }
}

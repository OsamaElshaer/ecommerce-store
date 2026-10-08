import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    @ApiOperation({ summary: 'Get current user cart' })
    @ApiResponse({ status: 200, description: 'Cart returned successfully' })
    @UseGuards(JwtAuthGuard)
    async getCart(@Req() req: any) {
        return this.cartService.getCart(req.user.id);
    }
}

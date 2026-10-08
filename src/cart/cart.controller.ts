import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get current user cart',
    })
    @ApiResponse({
        status: 200,
        description: 'Cart retrieved successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async getCart(@Req() req: any) {
        return this.cartService.getCart(req.user.id);
    }

    @Post('items')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Add a product to the cart',
    })
    @ApiResponse({
        status: 201,
        description: 'Product added to cart successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Requested quantity exceeds available stock',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    async addItem(@Req() req: any, @Body() dto: AddCartItemDto) {
        return this.cartService.addItem(req.user.id, dto);
    }

    @Patch('items/:itemId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Update cart item quantity',
    })
    @ApiResponse({
        status: 200,
        description: 'Cart item quantity updated successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Requested quantity exceeds available stock',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 404,
        description: 'Cart item or product not found',
    })
    async updateItem(
        @Req() req: any,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateCartItemDto,
    ) {
        return this.cartService.updateItem(req.user.id, itemId, dto);
    }

    @Delete('items/:itemId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Remove an item from the cart',
    })
    @ApiResponse({
        status: 200,
        description: 'Cart item removed successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 404,
        description: 'Cart item not found',
    })
    async removeItem(@Req() req: any, @Param('itemId') itemId: string) {
        return this.cartService.removeItem(req.user.id, itemId);
    }
}

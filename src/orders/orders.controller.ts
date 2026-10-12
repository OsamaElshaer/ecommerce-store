import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { QueryAdminOrdersDto } from './dto/query-admin-orders.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('checkout')
    @ApiOperation({
        summary: 'Create an order from the current cart',
    })
    @ApiResponse({
        status: 201,
        description: 'Order created successfully',
    })
    async checkout(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.createOrder(req.user.id, dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Get the current user orders',
    })
    @ApiResponse({
        status: 200,
        description: 'Orders retrieved successfully',
    })
    async findAll(@Req() req: any, @Query() query: QueryOrdersDto) {
        return this.ordersService.findAll(req.user.id, query);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get an order by ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Order retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async findOne(
        @Req() req: any,
        @Param('id', ParseUUIDPipe) orderId: string,
    ) {
        return this.ordersService.findOne(req.user.id, orderId);
    }

    @Patch(':id/cancel')
    @ApiOperation({
        summary: 'Cancel a pending order',
    })
    @ApiResponse({
        status: 200,
        description: 'Order cancelled successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Order cannot be cancelled',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async cancelOrder(
        @Req() req: any,
        @Param('id', ParseUUIDPipe) orderId: string,
    ) {
        return this.ordersService.cancelOrder(req.user.id, orderId);
    }

    @Get('admin/orders')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Get all orders (admin only)',
    })
    @ApiResponse({
        status: 200,
        description: 'Orders retrieved successfully',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: admin only',
    })
    async adminFindAll(@Query() query: QueryAdminOrdersDto) {
        return this.ordersService.adminFindAll(query);
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Update order status (admin only)',
    })
    @ApiResponse({
        status: 200,
        description: 'Order status updated successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Status transition not allowed',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: admin only',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    async updateStatus(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.ordersService.updateStatus(orderId, dto.status);
    }
}

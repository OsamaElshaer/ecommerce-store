import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { OrderStatus } from '../enums/order-status.enum';
import { QueryOrdersDto } from './query-orders.dto';

export class QueryAdminOrdersDto extends QueryOrdersDto {
    @ApiPropertyOptional({ enum: OrderStatus })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;
}

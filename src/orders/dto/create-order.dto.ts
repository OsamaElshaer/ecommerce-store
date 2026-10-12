import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateOrderDto {
    @ApiProperty({
        description: 'ID of the shipping address',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    address_id!: string;
}

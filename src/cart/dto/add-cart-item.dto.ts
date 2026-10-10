import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    product_id!: string;

    @ApiProperty({
        example: 2,
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number;
}

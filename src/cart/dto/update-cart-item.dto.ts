import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
    @ApiProperty({
        description: 'New quantity of the product',
        example: 3,
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    Min,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
    @ApiProperty({ example: 'Lavender Scented Candle' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 'A calming lavender-scented soy candle, 200g.' })
    @IsString()
    description!: string;

    @ApiProperty({ example: 149.99 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiProperty({ example: 50 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    stock!: number;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;

        return value;
    })
    @IsBoolean()
    is_active?: boolean;
}

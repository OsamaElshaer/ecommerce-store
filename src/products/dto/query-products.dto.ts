import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';

export enum ProductSort {
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    NEWEST = 'newest',
}

export class QueryProductsDto {
    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    page?: number = 1;

    @ApiPropertyOptional({ example: 20, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    limit?: number = 20;

    @ApiPropertyOptional({ example: 'candle' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 50 })
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ example: 300 })
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ enum: ProductSort, example: ProductSort.NEWEST })
    @IsOptional()
    @IsEnum(ProductSort)
    sort?: ProductSort;
}

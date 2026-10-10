import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Category name',
        example: 'Mobile Phones',
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @ApiProperty({
        description: 'URL-friendly unique category slug',
        example: 'mobile-phones',
        minLength: 2,
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message:
            'slug must contain only lowercase letters, numbers, and hyphens',
    })
    slug!: string;
}

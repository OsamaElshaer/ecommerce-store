import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateAddressDto {
    @ApiProperty({ example: 'Osama Elshaer' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    full_name!: string;

    @ApiProperty({ example: '+201012345678' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    phone!: string;

    @ApiProperty({ example: '15 Tahrir Street' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    street!: string;

    @ApiProperty({ example: 'Cairo' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city!: string;

    @ApiPropertyOptional({ example: 'Nasr City' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @ApiProperty({ example: 'Egypt' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    country!: string;

    @ApiPropertyOptional({ example: '11765' })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    postal_code?: string;

    @ApiPropertyOptional({
        description: 'Set this address as the default address',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    is_default?: boolean;
}

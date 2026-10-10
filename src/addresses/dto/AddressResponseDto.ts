import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    full_name!: string;

    @ApiProperty()
    phone!: string;

    @ApiProperty()
    street!: string;

    @ApiProperty()
    city!: string;

    @ApiProperty({ nullable: true })
    state!: string | null;

    @ApiProperty()
    country!: string;

    @ApiProperty({ nullable: true })
    postal_code!: string | null;

    @ApiProperty()
    is_default!: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    @IsString()
    token!: string;

    @ApiProperty({ example: 'newStrongPassword123', minLength: 8 })
    @IsString()
    @MinLength(8)
    new_password!: string;
}

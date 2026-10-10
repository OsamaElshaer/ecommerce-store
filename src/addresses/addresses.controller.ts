import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { Address } from './entities/address.entity';
import { AddressResponseDto } from './dto/AddressResponseDto';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) {}

    @Post()
    @ApiCreatedResponse({ type: Address })
    create(@Req() req: Request, @Body() dto: CreateAddressDto) {
        const userId = (
            req as Request & {
                user: { id: string };
            }
        ).user.id;

        return this.addressesService.create(userId, dto);
    }

    @Get()
    @ApiOkResponse({ type: AddressResponseDto, isArray: true })
    findAll(@Req() req: any) {
        return this.addressesService.findAll(req.user.id);
    }
}

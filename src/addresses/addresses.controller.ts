import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { Address } from './entities/address.entity';
import { AddressResponseDto } from './dto/AddressResponseDto';
import { UpdateAddressDto } from './dto/UpdateAddressDto';

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

    @Patch(':id')
    @ApiOkResponse({ type: AddressResponseDto })
    update(
        @Req() req: any,
        @Param('id') addressId: string,
        @Body() dto: UpdateAddressDto,
    ) {
        return this.addressesService.update(req.user.id, addressId, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Address deleted successfully' })
    remove(@Req() req: any, @Param('id') addressId: string) {
        return this.addressesService.remove(req.user.id, addressId);
    }

    @Patch(':id/default')
    @ApiOkResponse({ type: AddressResponseDto })
    setDefault(@Req() req: any, @Param('id') addressId: string) {
        return this.addressesService.setDefault(req.user.id, addressId);
    }
}

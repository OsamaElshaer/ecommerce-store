import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';

import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/UpdateAddressDto';

@Injectable()
export class AddressesService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,

        @InjectPinoLogger(AddressesService.name)
        private readonly logger: PinoLogger,
    ) {}
    async setDefault(userId: string, addressId: string): Promise<Address> {
        
        const address = await this.findOne(userId, addressId);

        await this.addressRepository.update(
            { user_id: userId, is_default: true },
            { is_default: false },
        );

        address.is_default = true;

        const updatedAddress = await this.addressRepository.save(address);

        this.logger.info(
            { userId, addressId },
            'Default address updated successfully',
        );

        return updatedAddress;
    }



    async create(userId: string, dto: CreateAddressDto): Promise<Address> {
        if (dto.is_default) {
            await this.addressRepository.update(
                { user_id: userId, is_default: true },
                { is_default: false },
            );
        }

        const address = this.addressRepository.create({
            ...dto,
            user_id: userId,
        });

        const savedAddress = await this.addressRepository.save(address);

        this.logger.info(
            {
                userId,
                addressId: savedAddress.id,
            },
            'Address created successfully',
        );

        return savedAddress;
    }

    async findAll(userId: string): Promise<Address[]> {
        this.logger.info({ userId }, 'Fetching user addresses');

        const addresses = await this.addressRepository.find({
            where: { user_id: userId },
            order: { is_default: 'DESC', created_at: 'DESC' },
        });

        return addresses;
    }

    async findOne(userId: string, addressId: string): Promise<Address> {
        this.logger.debug({ userId, addressId }, 'Fetching address');

        const address = await this.addressRepository.findOne({
            where: {
                id: addressId,
                user_id: userId,
            },
        });

        if (!address) {
            this.logger.warn({ userId, addressId }, 'Address not found');

            throw new NotFoundException('Address not found');
        }

        this.logger.debug(
            { userId, addressId },
            'Address fetched successfully',
        );

        return address;
    }

    async update(
        userId: string,
        addressId: string,
        dto: UpdateAddressDto,
    ): Promise<Address> {
        const address = await this.findOne(userId, addressId);

        if (dto.is_default === true) {
            await this.addressRepository.update(
                { user_id: userId, is_default: true },
                { is_default: false },
            );
        }

        Object.assign(address, dto);

        const updatedAddress = await this.addressRepository.save(address);

        this.logger.info({ userId, addressId }, 'Address updated successfully');

        return updatedAddress;
    }

    async remove(userId: string, addressId: string): Promise<void> {
        const result = await this.addressRepository.delete({
            id: addressId,
            user_id: userId,
        });

        if (result.affected === 0) {
            throw new NotFoundException('Address not found');
        }

        this.logger.info({ userId, addressId }, 'Address deleted successfully');
    }
}

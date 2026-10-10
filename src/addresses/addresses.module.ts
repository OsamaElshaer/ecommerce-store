import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { User } from '../users/entities/user.entity';
import { TypeOrmModule} from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Address, User])],
    providers: [AddressesService],
    controllers: [AddressesController],
})
export class AddressesModule {}

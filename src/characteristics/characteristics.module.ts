import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacteristicsService } from './characteristics.service';
import { CharacteristicsController } from './characteristics.controller';
import { Characteristic } from './entities/characteristic.entity';
import { UnitsModule } from '../units/units.module';

@Module({
  imports: [TypeOrmModule.forFeature([Characteristic]), UnitsModule],
  controllers: [CharacteristicsController],
  providers: [CharacteristicsService],
  exports: [CharacteristicsService],
})
export class CharacteristicsModule {}

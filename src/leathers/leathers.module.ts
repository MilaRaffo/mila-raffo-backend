import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeathersService } from './leathers.service';
import { LeathersController } from './leathers.controller';
import { Leather } from './entities/leather.entity';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [TypeOrmModule.forFeature([Leather]), ImagesModule],
  controllers: [LeathersController],
  providers: [LeathersService],
  exports: [LeathersService],
})
export class LeathersModule {}

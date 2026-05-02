import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { Variant } from './entities/variant.entity';
import { ProductsModule } from '../products/products.module';
import { ColorsModule } from '../colors/colors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Variant]),
    ProductsModule,
    ColorsModule,
  ],
  controllers: [VariantsController],
  providers: [VariantsService],
  exports: [VariantsService],
})
export class VariantsModule {}

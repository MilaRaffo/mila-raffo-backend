import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { Variant } from './entities/variant.entity';
import { VariantLeather } from './entities/variant-leather.entity';
import { ProductsModule } from '../products/products.module';
import { LeathersModule } from '../leathers/leathers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Variant, VariantLeather]),
    ProductsModule,
    LeathersModule,
  ],
  controllers: [VariantsController],
  providers: [VariantsService],
  exports: [VariantsService],
})
export class VariantsModule {}

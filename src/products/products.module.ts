import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductCharacteristic } from './entities/product-characteristic.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CategoriesModule } from '../categories/categories.module';
import { CharacteristicsModule } from '../characteristics/characteristics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCharacteristic,
      ProductCategory,
    ]),
    CategoriesModule,
    CharacteristicsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

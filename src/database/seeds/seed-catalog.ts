import { DataSource } from 'typeorm';
import { Color } from '../../colors/entities/color.entity';
import { Category } from '../../categories/entities/category.entity';
import { Characteristic } from '../../characteristics/entities/characteristic.entity';
import { Product } from '../../products/entities/product.entity';
import { Variant } from '../../variants/entities/variant.entity';
import { ProductCharacteristic } from '../../products/entities/product-characteristic.entity';
import { ProductCategory } from '../../products/entities/product-category.entity';
import { DataType, Measureunits } from '../../common/enums/characteristics.enum';

interface SeedCount {
  created: number;
  skipped: number;
}

const COLORS_DATA = [
  { name: 'Negro', code: 'negro', hex: '#1C1C1C' },
  { name: 'Marrón', code: 'marron', hex: '#6B3A2A' },
  { name: 'Camel', code: 'camel', hex: '#C19A6B' },
  { name: 'Beige', code: 'beige', hex: '#F5E6C8' },
  { name: 'Rojo vino', code: 'rojo-vino', hex: '#722F37' },
  { name: 'Verde oliva', code: 'verde-oliva', hex: '#6B7C45' },
  { name: 'Azul marino', code: 'azul-marino', hex: '#1F3054' },
  { name: 'Blanco', code: 'blanco', hex: '#F8F8F8' },
  { name: 'Taupe', code: 'taupe', hex: '#8B7D6B' },
  { name: 'Caramelo', code: 'caramelo', hex: '#C17A35' },
];

const CATEGORIES_DATA = [
  { name: 'Carteras', slug: 'carteras', description: 'Carteras de cuero artesanales' },
  { name: 'Bolsos', slug: 'bolsos', description: 'Bolsos de cuero premium' },
  { name: 'Billeteras', slug: 'billeteras', description: 'Billeteras de cuero fino' },
  { name: 'Accesorios', slug: 'accesorios', description: 'Accesorios de cuero y complementos' },
];

const CHARACTERISTICS_DATA = [
  { name: 'Ancho', dataType: DataType.NUMBER, units: Measureunits.CENTIMETER },
  { name: 'Alto', dataType: DataType.NUMBER, units: Measureunits.CENTIMETER },
  { name: 'Profundidad', dataType: DataType.NUMBER, units: Measureunits.CENTIMETER },
  { name: 'Largo del asa', dataType: DataType.NUMBER, units: Measureunits.CENTIMETER },
  { name: 'Largo de correa', dataType: DataType.NUMBER, units: Measureunits.CENTIMETER },
  { name: 'Material', dataType: DataType.TEXT, units: undefined },
  { name: 'Tipo de forro', dataType: DataType.TEXT, units: undefined },
  { name: 'Acabado', dataType: DataType.TEXT, units: undefined },
  { name: 'Compartimentos', dataType: DataType.NUMBER, units: undefined },
  { name: 'Tiene cierre', dataType: DataType.BOOLEAN, units: undefined },
  { name: 'Tiene bolsillo interno', dataType: DataType.BOOLEAN, units: undefined },
  { name: 'Correa regulable', dataType: DataType.BOOLEAN, units: undefined },
];

interface ProductSeedData {
  name: string;
  abbrev: string;
  categorySlug: string;
  basePrice: number;
  variants: Array<{ colorCode: string; stock: number }>;
  characteristics: Array<{ charName: string; value: string }>;
}

const PRODUCTS_DATA: ProductSeedData[] = [
  {
    name: 'Cartera Aurora',
    abbrev: 'AURORA',
    categorySlug: 'carteras',
    basePrice: 289.99,
    variants: [
      { colorCode: 'negro', stock: 10 },
      { colorCode: 'camel', stock: 6 },
      { colorCode: 'rojo-vino', stock: 4 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '28' },
      { charName: 'Alto', value: '20' },
      { charName: 'Profundidad', value: '10' },
      { charName: 'Largo del asa', value: '35' },
      { charName: 'Material', value: 'Cuero natural' },
      { charName: 'Tipo de forro', value: 'Textil premium' },
      { charName: 'Compartimentos', value: '3' },
      { charName: 'Tiene cierre', value: 'true' },
      { charName: 'Tiene bolsillo interno', value: 'true' },
      { charName: 'Correa regulable', value: 'true' },
      { charName: 'Acabado', value: 'Semi mate' },
    ],
  },
  {
    name: 'Bolso Valentina',
    abbrev: 'VALENTINA',
    categorySlug: 'bolsos',
    basePrice: 349.99,
    variants: [
      { colorCode: 'marron', stock: 8 },
      { colorCode: 'beige', stock: 5 },
      { colorCode: 'verde-oliva', stock: 3 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '35' },
      { charName: 'Alto', value: '28' },
      { charName: 'Profundidad', value: '14' },
      { charName: 'Largo del asa', value: '40' },
      { charName: 'Largo de correa', value: '110' },
      { charName: 'Material', value: 'Cuero vacuno' },
      { charName: 'Tipo de forro', value: 'Satén premium' },
      { charName: 'Compartimentos', value: '2' },
      { charName: 'Tiene cierre', value: 'true' },
      { charName: 'Tiene bolsillo interno', value: 'true' },
      { charName: 'Correa regulable', value: 'true' },
      { charName: 'Acabado', value: 'Brillante' },
    ],
  },
  {
    name: 'Billetera Sofía',
    abbrev: 'SOFIA',
    categorySlug: 'billeteras',
    basePrice: 89.99,
    variants: [
      { colorCode: 'negro', stock: 15 },
      { colorCode: 'caramelo', stock: 10 },
      { colorCode: 'rojo-vino', stock: 7 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '12' },
      { charName: 'Alto', value: '9' },
      { charName: 'Profundidad', value: '2' },
      { charName: 'Material', value: 'Cuero natural' },
      { charName: 'Tipo de forro', value: 'Textil' },
      { charName: 'Compartimentos', value: '6' },
      { charName: 'Tiene cierre', value: 'false' },
      { charName: 'Tiene bolsillo interno', value: 'true' },
      { charName: 'Acabado', value: 'Liso' },
    ],
  },
  {
    name: 'Tote Isabella',
    abbrev: 'ISABELLA',
    categorySlug: 'bolsos',
    basePrice: 399.99,
    variants: [
      { colorCode: 'camel', stock: 6 },
      { colorCode: 'taupe', stock: 4 },
      { colorCode: 'azul-marino', stock: 3 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '42' },
      { charName: 'Alto', value: '36' },
      { charName: 'Profundidad', value: '16' },
      { charName: 'Largo del asa', value: '55' },
      { charName: 'Material', value: 'Cuero premium' },
      { charName: 'Tipo de forro', value: 'Algodón reforzado' },
      { charName: 'Compartimentos', value: '1' },
      { charName: 'Tiene cierre', value: 'false' },
      { charName: 'Tiene bolsillo interno', value: 'true' },
      { charName: 'Correa regulable', value: 'false' },
      { charName: 'Acabado', value: 'Natural' },
    ],
  },
  {
    name: 'Mini Bag Emilia',
    abbrev: 'EMILIA',
    categorySlug: 'accesorios',
    basePrice: 159.99,
    variants: [
      { colorCode: 'negro', stock: 12 },
      { colorCode: 'blanco', stock: 8 },
      { colorCode: 'rojo-vino', stock: 5 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '18' },
      { charName: 'Alto', value: '14' },
      { charName: 'Profundidad', value: '6' },
      { charName: 'Largo de correa', value: '120' },
      { charName: 'Material', value: 'Cuero suave' },
      { charName: 'Tipo de forro', value: 'Textil' },
      { charName: 'Compartimentos', value: '2' },
      { charName: 'Tiene cierre', value: 'true' },
      { charName: 'Tiene bolsillo interno', value: 'false' },
      { charName: 'Correa regulable', value: 'true' },
      { charName: 'Acabado', value: 'Mate' },
    ],
  },
  {
    name: 'Crossbody Luciana',
    abbrev: 'LUCIANA',
    categorySlug: 'accesorios',
    basePrice: 219.99,
    variants: [
      { colorCode: 'marron', stock: 9 },
      { colorCode: 'verde-oliva', stock: 5 },
      { colorCode: 'camel', stock: 7 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '25' },
      { charName: 'Alto', value: '18' },
      { charName: 'Profundidad', value: '8' },
      { charName: 'Largo de correa', value: '130' },
      { charName: 'Material', value: 'Cuero curtido' },
      { charName: 'Tipo de forro', value: 'Textil premium' },
      { charName: 'Compartimentos', value: '3' },
      { charName: 'Tiene cierre', value: 'true' },
      { charName: 'Tiene bolsillo interno', value: 'true' },
      { charName: 'Correa regulable', value: 'true' },
      { charName: 'Acabado', value: 'Semi mate' },
    ],
  },
  {
    name: 'Neceser Camila',
    abbrev: 'CAMILA',
    categorySlug: 'accesorios',
    basePrice: 129.99,
    variants: [
      { colorCode: 'negro', stock: 14 },
      { colorCode: 'beige', stock: 9 },
      { colorCode: 'taupe', stock: 6 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '24' },
      { charName: 'Alto', value: '15' },
      { charName: 'Profundidad', value: '10' },
      { charName: 'Material', value: 'Cuero resistente' },
      { charName: 'Tipo de forro', value: 'Impermeable' },
      { charName: 'Compartimentos', value: '1' },
      { charName: 'Tiene cierre', value: 'true' },
      { charName: 'Tiene bolsillo interno', value: 'false' },
      { charName: 'Acabado', value: 'Texturizado' },
    ],
  },
  {
    name: 'Monedero Martina',
    abbrev: 'MARTINA',
    categorySlug: 'accesorios',
    basePrice: 59.99,
    variants: [
      { colorCode: 'negro', stock: 20 },
      { colorCode: 'rojo-vino', stock: 12 },
      { colorCode: 'caramelo', stock: 8 },
      { colorCode: 'beige', stock: 10 },
    ],
    characteristics: [
      { charName: 'Ancho', value: '10' },
      { charName: 'Alto', value: '8' },
      { charName: 'Profundidad', value: '1' },
      { charName: 'Material', value: 'Cuero suave' },
      { charName: 'Compartimentos', value: '4' },
      { charName: 'Tiene cierre', value: 'true' },
      { charName: 'Tiene bolsillo interno', value: 'false' },
      { charName: 'Acabado', value: 'Liso' },
    ],
  },
];

export async function seedCatalog(dataSource: DataSource): Promise<void> {
  const colorRepo = dataSource.getRepository(Color);
  const categoryRepo = dataSource.getRepository(Category);
  const characteristicRepo = dataSource.getRepository(Characteristic);
  const productRepo = dataSource.getRepository(Product);
  const variantRepo = dataSource.getRepository(Variant);
  const productCategoryRepo = dataSource.getRepository(ProductCategory);
  const productCharRepo = dataSource.getRepository(ProductCharacteristic);

  console.log('\n🌱 Iniciando seed del catálogo Mila Raffo...\n');

  const counts: Record<string, SeedCount> = {
    colors: { created: 0, skipped: 0 },
    categories: { created: 0, skipped: 0 },
    characteristics: { created: 0, skipped: 0 },
    products: { created: 0, skipped: 0 },
    variants: { created: 0, skipped: 0 },
    productCategories: { created: 0, skipped: 0 },
    productCharacteristics: { created: 0, skipped: 0 },
  };

  // ─── 1. COLORS ────────────────────────────────────────────────────────────
  console.log('🎨 Seeding colors...');
  const colorsMap = new Map<string, Color>();

  for (const colorData of COLORS_DATA) {
    let color = await colorRepo.findOne({ where: { code: colorData.code } });
    if (!color) {
      color = colorRepo.create({ ...colorData, isActive: true });
      await colorRepo.save(color);
      console.log(`  ✅ Created: ${colorData.name}`);
      counts.colors.created++;
    } else {
      console.log(`  ⏭️  Skipped: ${colorData.name}`);
      counts.colors.skipped++;
    }
    colorsMap.set(colorData.code, color);
  }

  // ─── 2. CATEGORIES ────────────────────────────────────────────────────────
  console.log('\n📂 Seeding categories...');
  const categoriesMap = new Map<string, Category>();

  for (const catData of CATEGORIES_DATA) {
    let category = await categoryRepo.findOne({ where: { slug: catData.slug } });
    if (!category) {
      category = categoryRepo.create({ ...catData, parentId: null, active: true });
      await categoryRepo.save(category);
      console.log(`  ✅ Created: ${catData.name}`);
      counts.categories.created++;
    } else {
      console.log(`  ⏭️  Skipped: ${catData.name}`);
      counts.categories.skipped++;
    }
    categoriesMap.set(catData.slug, category);
  }

  // ─── 3. CHARACTERISTICS ───────────────────────────────────────────────────
  console.log('\n📋 Seeding characteristics...');
  const charsMap = new Map<string, Characteristic>();

  for (const charData of CHARACTERISTICS_DATA) {
    let characteristic = await characteristicRepo.findOne({ where: { name: charData.name } });
    if (!characteristic) {
      characteristic = characteristicRepo.create({
        name: charData.name,
        dataType: charData.dataType,
        units: charData.units,
      });
      await characteristicRepo.save(characteristic);
      console.log(`  ✅ Created: ${charData.name}`);
      counts.characteristics.created++;
    } else {
      console.log(`  ⏭️  Skipped: ${charData.name}`);
      counts.characteristics.skipped++;
    }
    charsMap.set(charData.name, characteristic);
  }

  // ─── 4. PRODUCTS, VARIANTS & CHARACTERISTICS ──────────────────────────────
  console.log('\n👜 Seeding products, variants & characteristics...');

  for (const productData of PRODUCTS_DATA) {
    console.log(`\n  📦 ${productData.name}`);

    // 4a. Product
    let product = await productRepo.findOne({ where: { name: productData.name } });
    if (!product) {
      product = productRepo.create({
        name: productData.name,
        basePrice: productData.basePrice,
        available: true,
        isCustomizable: false,
      });
      await productRepo.save(product);
      console.log(`     ✅ Product created`);
      counts.products.created++;
    } else {
      console.log(`     ⏭️  Product skipped`);
      counts.products.skipped++;
    }

    // 4b. Variants
    for (const variantData of productData.variants) {
      const color = colorsMap.get(variantData.colorCode);
      if (!color) {
        console.warn(`     ⚠️  Color not found: ${variantData.colorCode}`);
        continue;
      }

      const sku = `${productData.abbrev}-${variantData.colorCode.toUpperCase()}`;
      let variant = await variantRepo.findOne({ where: { sku } });
      if (!variant) {
        variant = variantRepo.create({
          productId: product.id,
          colorId: color.id,
          sku,
          price: productData.basePrice,
          stock: variantData.stock,
          isAvailable: true,
        });
        await variantRepo.save(variant);
        console.log(`     ✅ Variant: ${sku} (stock: ${variantData.stock})`);
        counts.variants.created++;
      } else {
        console.log(`     ⏭️  Variant skipped: ${sku}`);
        counts.variants.skipped++;
      }
    }

    // 4c. ProductCategory
    const category = categoriesMap.get(productData.categorySlug);
    if (category) {
      const existingProdCat = await productCategoryRepo.findOne({
        where: { productId: product.id, categoryId: category.id },
      });
      if (!existingProdCat) {
        const productCategory = productCategoryRepo.create({
          productId: product.id,
          categoryId: category.id,
        });
        await productCategoryRepo.save(productCategory);
        console.log(`     ✅ Category linked: ${productData.categorySlug}`);
        counts.productCategories.created++;
      } else {
        console.log(`     ⏭️  Category link skipped`);
        counts.productCategories.skipped++;
      }
    } else {
      console.warn(`     ⚠️  Category not found: ${productData.categorySlug}`);
    }

    // 4d. ProductCharacteristics
    for (const charVal of productData.characteristics) {
      const characteristic = charsMap.get(charVal.charName);
      if (!characteristic) {
        console.warn(`     ⚠️  Characteristic not found: ${charVal.charName}`);
        continue;
      }

      const existingProdChar = await productCharRepo.findOne({
        where: { productId: product.id, characteristicId: characteristic.id },
      });
      if (!existingProdChar) {
        const productChar = productCharRepo.create({
          productId: product.id,
          characteristicId: characteristic.id,
          value: charVal.value,
        });
        await productCharRepo.save(productChar);
        counts.productCharacteristics.created++;
      } else {
        counts.productCharacteristics.skipped++;
      }
    }
    console.log(
      `     ✅ Characteristics: ${productData.characteristics.length} processed`,
    );
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('  Catalog Seed Summary');
  console.log('════════════════════════════════════════');
  for (const [entity, count] of Object.entries(counts)) {
    console.log(`  ${entity.padEnd(24)} created: ${count.created}, skipped: ${count.skipped}`);
  }
  console.log('════════════════════════════════════════\n');
  console.log('🎉 Catalog seed completed successfully!\n');
}

import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ProductCategory } from '../../products/entities/product-category.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true, name: 'parent_id' })
  parentId: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(
    () => ProductCategory,
    (productCategory) => productCategory.category,
  )
  productCategories: ProductCategory[];
}

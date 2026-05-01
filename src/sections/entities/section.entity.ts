import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SectionItem } from './section-item.entity';

export enum SectionType {
  HERO = 'hero',
  CAROUSEL = 'carousel',
  FEATURED_CATALOG = 'featured_catalog',
  CATEGORIES = 'categories',
  TESTIMONIALS = 'testimonials',
  BANNERS = 'banners',
}

@Entity('sections')
export class Section extends BaseEntity {
  @Column({ type: 'enum', enum: SectionType })
  type: SectionType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subtitle?: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => SectionItem, (item) => item.section, { cascade: true })
  items: SectionItem[];
}

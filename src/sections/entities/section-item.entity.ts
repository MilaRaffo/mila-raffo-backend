import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Section } from './section.entity';
import { Image } from '../../images/entities/image.entity';
import { type UUID } from 'crypto';

@Entity('section_items')
export class SectionItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'section_id' })
  sectionId: UUID;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', name: 'image_id', nullable: true })
  imageId?: UUID;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'simple-json', nullable: true, name: 'extra_data' })
  extraData?: Record<string, any>;

  @ManyToOne(() => Section, (section) => section.items)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToOne(() => Image, { nullable: true, eager: true })
  @JoinColumn({ name: 'image_id' })
  image?: Image;
}

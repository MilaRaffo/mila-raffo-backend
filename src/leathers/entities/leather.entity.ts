import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Image } from '../../images/entities/image.entity';
import { VariantLeather } from '../../variants/entities/variant-leather.entity';
import { type UUID } from 'crypto';

@Entity('leathers')
export class Leather extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'uuid', nullable: true, name: 'image_id' })
  imageId: UUID | null;

  @ManyToOne(() => Image, { nullable: true, eager: true })
  @JoinColumn({ name: 'image_id' })
  image?: Image;

  @OneToMany(
    () => VariantLeather,
    (variantLeather) => variantLeather.leather,
  )
  variantLeathers: VariantLeather[];
}

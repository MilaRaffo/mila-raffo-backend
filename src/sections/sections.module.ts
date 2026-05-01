import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { Section, SectionItem } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Section, SectionItem])],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}

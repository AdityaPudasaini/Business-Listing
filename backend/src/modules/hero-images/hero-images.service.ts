import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHeroImageDto } from './dto/create-hero-image.dto';

@Injectable()
export class HeroImagesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.heroImage.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateHeroImageDto) {
    // New images go to the end of the list by default, so admins don't have
    // to think about ordering unless they actually want to reorder.
    const count = await this.prisma.heroImage.count();
    return this.prisma.heroImage.create({
      data: { url: dto.url, order: dto.order ?? count },
    });
  }

  async remove(id: string) {
    const image = await this.prisma.heroImage.findUnique({ where: { id } });
    if (!image) {
      throw new NotFoundException('Hero image not found');
    }
    return this.prisma.heroImage.delete({ where: { id } });
  }
}
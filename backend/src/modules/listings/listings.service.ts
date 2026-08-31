import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: BusinessFilterDto) {
    return this.prisma.business.findMany({
      where: {
        status: 'approved',
        category: filters.category ?? undefined,
        location: filters.location ?? undefined,
      },
    });
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business || business.status !== 'approved') {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  create(dto: CreateBusinessDto, ownerId: string) {
    return this.prisma.business.create({
      data: { ...dto, ownerId, status: 'pending' },
    });
  }

  async update(id: string, dto: UpdateBusinessDto, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }
    return this.prisma.business.update({
      where: { id },
      data: { ...dto, status: 'pending' },
    });
  }

  findPending() {
    return this.prisma.business.findMany({ where: { status: 'pending' } });
  }

  async approve(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({ where: { id }, data: { status: 'approved' } });
  }

  async reject(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({ where: { id }, data: { status: 'rejected' } });
  }
}
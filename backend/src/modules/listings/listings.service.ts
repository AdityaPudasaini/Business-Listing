import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  // Public: only approved listings are visible
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

  // Any logged-in user can submit a listing; it starts as pending
  create(dto: CreateBusinessDto, ownerId: string) {
    return this.prisma.business.create({
      data: { ...dto, ownerId, status: 'pending' },
    });
  }

  // Owner can edit their listing; edit sends it back to pending for re-review
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

  // Admin only: list everything awaiting review
  findPending(requesterRole: string) {
    if (requesterRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.prisma.business.findMany({ where: { status: 'pending' } });
  }

  // Admin only: approve a listing
  async approve(id: string, requesterRole: string) {
    if (requesterRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({ where: { id }, data: { status: 'approved' } });
  }

  // Admin only: reject a listing
  async reject(id: string, requesterRole: string) {
    if (requesterRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({ where: { id }, data: { status: 'rejected' } });
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(
    businessId: string,
    dto: CreateProductDto,
    actor: { userId: string; role?: string },
  ) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    // Only the owner (or an admin) may add products to a listing.
    if (business.ownerId !== actor.userId && actor.role !== 'admin') {
      throw new ForbiddenException('You do not own this business');
    }
    return this.prisma.product.create({
      data: { ...dto, businessId },
    });
  }

  findAll(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.business.ownerId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { business: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.business.ownerId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }
    return this.prisma.product.delete({ where: { id } });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(businessId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, businessId },
    });
  }

  findAll(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId },
    });
  }

}
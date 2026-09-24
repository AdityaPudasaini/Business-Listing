import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Flat, ordered list — the frontend nests it into Category/SubCategory
  // itself (see toCategory() in the frontend's api.ts), same division of
  // labor as everywhere else in this API.
  findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      // Only two levels deep, matching the frontend's Category/SubCategory
      // type — a sub-category can't itself have children.
      if (parent.parentId) {
        throw new BadRequestException(
          'Cannot nest a category under a sub-category — only two levels are supported.',
        );
      }
    }

    const id = await this.generateUniqueId(dto.label);

    // New categories go to the end of their own level by default, same
    // "don't make the admin think about ordering" default as hero images.
    const count = await this.prisma.category.count({
      where: { parentId: dto.parentId ?? null },
    });

    return this.prisma.category.create({
      data: {
        id,
        label: dto.label,
        icon: dto.icon,
        order: dto.order ?? count,
        parentId: dto.parentId,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        label: dto.label,
        icon: dto.icon,
        order: dto.order,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // category is just a plain string column on Business/Product with no
    // foreign key, so deleting a row here can't cascade to them — it would
    // silently orphan every listing filed under it (or under one of its
    // children). Block instead, and tell the admin how many are affected.
    const ids = [id, ...category.children.map((child) => child.id)];
    const [businessCount, productCount] = await Promise.all([
      this.prisma.business.count({ where: { category: { in: ids } } }),
      this.prisma.product.count({ where: { category: { in: ids } } }),
    ]);

    if (businessCount > 0 || productCount > 0) {
      throw new ConflictException(
        `Cannot delete: ${businessCount} listing(s) and ${productCount} product(s) still use this category. Move or re-categorize them first.`,
      );
    }

    // Cascades to children at the DB level (onDelete: Cascade), but nothing
    // reaches them by the time we get here since the count above was 0.
    return this.prisma.category.delete({ where: { id } });
  }

  private async generateUniqueId(label: string): Promise<string> {
    const base = slugify(label);
    if (!base) {
      throw new BadRequestException(
        'Label must contain at least one letter or number.',
      );
    }
    let candidate = base;
    let suffix = 2;

    while (await this.prisma.category.findUnique({ where: { id: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix++;
    }

    return candidate;
  }
}

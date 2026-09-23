import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAccountDto } from '../listings/dto/update-account.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private uploads: UploadsService) {}

  // Shape matches OwnerAccount on the frontend:
  // { ownerName, username, email, phone }.
  // There's no separate `username` column, so email doubles as the username —
  // same identifier the person already logs in with.
  private toAccount(user: {
    name: string;
    email: string;
    phone: string | null;
  }) {
    return {
      ownerName: user.name,
      username: user.email,
      email: user.email,
      phone: user.phone ?? '',
    };
  }

  async getAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    return this.toAccount(user);
  }

  async updateAccount(userId: string, dto: UpdateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? undefined,
        phone: dto.phone ?? undefined,
      },
    });

    return this.toAccount(updated);
  }

  // Admin-only listing — excludes passwordHash/resetToken by construction
  // (select, not the full row) so a secret never leaves the service layer.
  async findAllForAdmin() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            Business: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? '',
      createdAt: user.createdAt,
      businessCount: user._count.Business,
    }));
  }

  async updateRole(
    id: string,
    role: 'user' | 'admin',
    requestingUserId: string,
  ) {
    if (id === requestingUserId) {
      // Without this an admin could demote themselves out of the only
      // account that can undo it, with no other admin route to fix it.
      throw new BadRequestException(
        'You cannot change your own role.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone ?? '',
      createdAt: updated.createdAt,
    };
  }

  // Deletes the account and everything it owns. Businesses/reviews/bookings
  // all cascade at the DB level (onDelete: Cascade), but image files on
  // disk don't — those have to be cleaned up here first, business by
  // business, before the DB delete happens.
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
      include: { products: true },
    });

    const fileUrls = businesses.flatMap((business) => [
      business.image,
      business.coverImage,
      ...business.gallery,
      ...business.products.map((product) => product.image),
    ]);

    await Promise.all(fileUrls.map((url) => this.uploads.deleteFile(url)));

    // Cascades to Business (and from there to Reviews/Bookings/Products),
    // and to this user's own Review/Booking rows on businesses they don't own.
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Account deleted' };
  }
}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAccountDto } from '../listings/dto/update-account.dto';
import { UpdateBanDto } from '../listings/dto/update-ban.dto';
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
        isBanned: true,
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
      isBanned: user.isBanned,
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
      include: { _count: { select: { Business: true } } },
    });

    return this.toAdminRow(updated);
  }

  // Same shape as one row of findAllForAdmin(), so the admin table can swap
  // the row in place after a role/ban change without losing isBanned or
  // businessCount.
  private toAdminRow(user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    isBanned: boolean;
    createdAt: Date;
    _count: { Business: number };
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? '',
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      businessCount: user._count.Business,
    };
  }

  async setBanned(id: string, dto: UpdateBanDto, requestingUserId: string) {
    if (id === requestingUserId) {
      // Same reasoning as updateRole: without this an admin could lock
      // themselves out with no other admin account left to reverse it.
      throw new BadRequestException('You cannot ban your own account.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Banning is more than a login block — a banned owner's listings should
    // come down too, or the ban has no visible effect on the public site.
    // Only currently-approved listings are pulled down (to 'rejected', the
    // status the approve/reject flow already uses to hide a listing);
    // pending/rejected ones are left alone. Unbanning does NOT auto-restore
    // them — an admin re-approves through the normal review flow.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isBanned: dto.isBanned },
      }),
      ...(dto.isBanned
        ? [
            this.prisma.business.updateMany({
              where: { ownerId: id, status: 'approved' },
              data: { status: 'rejected' },
            }),
          ]
        : []),
    ]);

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { Business: true } } },
    });
    return this.toAdminRow(updated);
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
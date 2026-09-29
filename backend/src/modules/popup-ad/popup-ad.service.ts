import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { UpdatePopupAdDto } from './dto/update-popup-ad.dto';

// There is only ever one entry popup, so this table holds at most one row.
@Injectable()
export class PopupAdService {
  constructor(private prisma: PrismaService, private uploads: UploadsService) {}

  private current() {
    return this.prisma.popupAd.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  // `ad: null` means nothing is configured, so the frontend falls back to its
  // built-in default. Wrapped in an object because Nest sends an empty body
  // for a bare null, which breaks res.json() in the browser.
  async get() {
    return { ad: await this.current() };
  }

  async save(dto: UpdatePopupAdDto) {
    const existing = await this.current();

    if (!existing) {
      if (!dto.image) {
        throw new BadRequestException('Upload an image to create the popup ad.');
      }
      const ad = await this.prisma.popupAd.create({
        data: {
          image: dto.image,
          href: dto.href || null,
          alt: dto.alt || null,
          active: dto.active ?? true,
        },
      });
      return { ad };
    }

    const ad = await this.prisma.popupAd.update({
      where: { id: existing.id },
      data: {
        ...(dto.image !== undefined ? { image: dto.image } : {}),
        ...(dto.href !== undefined ? { href: dto.href || null } : {}),
        ...(dto.alt !== undefined ? { alt: dto.alt || null } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });

    // Replaced image: remove the old file so uploads/ doesn't fill with orphans.
    if (dto.image && dto.image !== existing.image) {
      await this.uploads.deleteFile(existing.image);
    }
    return { ad };
  }

  // Removes the custom ad entirely; the site goes back to its default popup.
  async remove() {
    const existing = await this.current();
    if (existing) {
      await this.prisma.popupAd.deleteMany();
      await this.uploads.deleteFile(existing.image);
    }
    return { ad: null };
  }
}

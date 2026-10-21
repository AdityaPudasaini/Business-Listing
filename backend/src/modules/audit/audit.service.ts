// audit.service.ts -- writes and reads the audit trail.
// log() never throws: a failure to write an audit row must not break the request it describes.
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface AuditEntry extends RequestContext {
  action: string;
  userId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          ip: entry.ip ? entry.ip.slice(0, 64) : null,
          userAgent: entry.userAgent ? entry.userAgent.slice(0, 255) : null,
          ...(entry.metadata ? { metadata: entry.metadata as Prisma.InputJsonObject } : {}),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log "${entry.action}": ${(error as Error).message}`);
    }
  }

  async findAll(params: { page?: number; limit?: number; action?: string; userId?: string }) {
    const page = Math.max(1, Math.floor(params.page || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(params.limit || 25)));
    const where: Prisma.AuditLogWhereInput = {};
    // startsWith so "auth" returns every auth.* event.
    if (params.action) where.action = { startsWith: params.action };
    if (params.userId) where.userId = params.userId;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // No FK to User, so attach name/email by hand (deleted accounts simply have no user).
    const ids = [...new Set(rows.map((row) => row.userId).filter((id): id is string => !!id))];
    const users = ids.length
      ? await this.prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const byId = new Map(users.map((user) => [user.id, user]));

    return {
      items: rows.map((row) => ({ ...row, user: row.userId ? byId.get(row.userId) ?? null : null })),
      total,
      page,
      limit,
    };
  }
}

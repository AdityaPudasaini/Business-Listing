// audit.interceptor.ts -- global interceptor that records routes marked with @Audit().
// It runs after the guards, so req.user is already the authenticated actor.
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditMeta } from './audit.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap((result) => {
        const metadata: Record<string, unknown> = {};
        for (const field of meta.bodyFields ?? []) {
          if (req.body && field in req.body) metadata[field] = req.body[field];
        }
        void this.audit.log({
          action: meta.action,
          userId: req.user?.userId,
          targetType: meta.targetType,
          // Prefer the :id in the URL; fall back to the id of a newly created row.
          targetId: req.params?.id ?? (result as { id?: string } | undefined)?.id,
          ip: req.ip,
          userAgent: req.headers?.['user-agent'],
          metadata: Object.keys(metadata).length ? metadata : undefined,
        });
      }),
    );
  }
}

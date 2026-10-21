// audit.decorator.ts -- put @Audit('some.action') on a route handler and a row is written
// to the audit log after the handler succeeds. Only the body fields listed in bodyFields
// are recorded, so passwords and other secrets can never leak into the log by accident.
import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_meta';

export interface AuditMeta {
  action: string;
  targetType?: string;
  bodyFields?: string[];
}

export const Audit = (action: string, options: { targetType?: string; bodyFields?: string[] } = {}) =>
  SetMetadata(AUDIT_KEY, { action, ...options } as AuditMeta);

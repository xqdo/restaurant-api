import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

/**
 * Audit Interceptor - Automatically logs all mutating operations (POST/PUT/PATCH/DELETE)
 * Applied globally to capture every write operation across all controllers
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  private readonly METHOD_LABELS: Record<string, string> = {
    POST: 'CREATED',
    PUT: 'UPDATED',
    PATCH: 'UPDATED',
    DELETE: 'DELETED',
  };

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Only audit mutating methods
    const actionLabel = this.METHOD_LABELS[method];
    if (!actionLabel) {
      return next.handle();
    }

    // Derive event name from the URL path
    // e.g. POST /receipts → RECEIPT_CREATED
    // e.g. PUT /receipts/5/items/3/status → RECEIPT_ITEM_STATUS_UPDATED
    // e.g. DELETE /menu/items/10 → MENU_ITEM_DELETED
    const event = this.buildEventName(url, actionLabel);

    return next.handle().pipe(
      tap(() => {
        this.auditService
          .createLog({
            user_id: user?.id || null,
            event,
          })
          .catch((error) => {
            this.logger.error(`Failed to create audit log: ${error.message}`);
          });
      }),
    );
  }

  /**
   * Build a readable event name from URL path and HTTP method
   * /auth/login → AUTH_LOGIN
   * /receipts → RECEIPT
   * /receipts/5/complete → RECEIPT_COMPLETE
   * /menu/items/10 → MENU_ITEM
   * /delivery/receipts/assign → DELIVERY_RECEIPT_ASSIGN
   * /tables/3/status → TABLE_STATUS
   *
   * Then appends the action label: _CREATED, _UPDATED, _DELETED
   */
  private buildEventName(url: string, actionLabel: string): string {
    // Remove query string
    const path = url.split('?')[0];

    // Split into segments, remove empty and numeric segments
    const segments = path
      .split('/')
      .filter((s) => s && !/^\d+$/.test(s));

    // Convert to UPPER_SNAKE_CASE and singularize common plurals
    const parts = segments.map((s) => this.singularize(s).toUpperCase());

    // Join and append action
    const resource = parts.join('_');
    return `${resource}_${actionLabel}`;
  }

  /**
   * Simple singularize for common restaurant system resources
   */
  private singularize(word: string): string {
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('ses')) return word.slice(0, -2);
    if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us'))
      return word.slice(0, -1);
    return word;
  }
}

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
 * Audit Interceptor - Automatically logs critical operations
 * Can be applied globally or to specific controllers/routes
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Define which routes should be audited
    const auditableRoutes = [
      { path: '/auth/login', event: 'USER_LOGIN' },
      { path: '/auth/register', event: 'USER_REGISTERED' },
      { path: '/receipts', method: 'POST', event: 'RECEIPT_CREATED' },
      { path: '/receipts', method: 'PUT', event: 'RECEIPT_UPDATED' },
      { path: '/receipts', method: 'PATCH', event: 'RECEIPT_UPDATED' },
      { path: '/receipts', method: 'DELETE', event: 'RECEIPT_DELETED' },
      { path: '/menu/items', method: 'POST', event: 'MENU_ITEM_CREATED' },
      { path: '/menu/items', method: 'PUT', event: 'MENU_ITEM_UPDATED' },
      { path: '/discounts', method: 'POST', event: 'DISCOUNT_CREATED' },
    ];

    // Check if this route should be audited
    const auditEntry = auditableRoutes.find(
      (route) =>
        url.includes(route.path) &&
        (!route.method || route.method === method),
    );

    if (auditEntry) {
      return next.handle().pipe(
        tap(() => {
          // Log after successful operation
          this.auditService
            .createLog({
              user_id: user?.id,
              event: auditEntry.event,
            })
            .catch((error) => {
              this.logger.error(`Failed to create audit log: ${error.message}`);
            });
        }),
      );
    }

    return next.handle();
  }
}

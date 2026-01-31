import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../services/logger.service';
import {
  LOG_ACTION_KEY,
  LogActionOptions,
} from '../decorators/log-action.decorator';

@Injectable()
export class BusinessLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('Business');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logOptions = this.reflector.get<LogActionOptions>(
      LOG_ACTION_KEY,
      context.getHandler(),
    );

    if (!logOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { action, resource, includeResult, includeParams } = logOptions;

    const metadata: any = {
      userId: user?.id,
      userEmail: user?.email,
      resource,
      action,
    };

    if (includeParams) {
      metadata.params = {
        ...request.params,
        ...request.query,
      };
      metadata.body = request.body;
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (result) => {
          const duration = Date.now() - startTime;

          if (includeResult && result) {
            metadata.resourceId = result.id;
            metadata.result = result;
          }

          metadata.duration = duration;
          metadata.success = true;

          this.logger.business(action, metadata);
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logger.error(`Business action failed: ${action}`, error.stack, {
            ...metadata,
            duration,
            success: false,
            error: {
              message: error.message,
              name: error.name,
            },
          });
        },
      }),
    );
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { Request, Response } from 'express';

interface RequestWithUser extends Request {
  user?: { id?: string; email?: string };
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Obtener información del usuario si está autenticado
    const user = request.user;
    const userId = user?.id;
    const userEmail = user?.email;

    // Log de entrada
    this.logger.http(`Incoming ${method} ${url}`, {
      method,
      endpoint: url,
      ip,
      userAgent,
      userId,
      userEmail,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.http(`Completed ${method} ${url}`, {
            method,
            endpoint: url,
            statusCode,
            duration,
            ip,
            userId,
            userEmail,
            success: true,
          });
        },
        error: (error: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode =
            error instanceof Object && 'status' in error
              ? Number((error as { status?: number }).status)
              : 500;
          const message =
            error instanceof Error ? error.message : String(error);
          const name = error instanceof Error ? error.name : 'Error';
          const stack = error instanceof Error ? error.stack : undefined;

          this.logger.error(`Failed ${method} ${url}`, stack, {
            method,
            endpoint: url,
            statusCode,
            duration,
            ip,
            userId,
            userEmail,
            error: {
              message,
              name,
              stack,
            },
            success: false,
          });
        },
      }),
    );
  }
}

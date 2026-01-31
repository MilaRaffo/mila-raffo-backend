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

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Obtener información del usuario si está autenticado
    const user = (request as any).user;
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
        next: (data) => {
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
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(`Failed ${method} ${url}`, error.stack, {
            method,
            endpoint: url,
            statusCode,
            duration,
            ip,
            userId,
            userEmail,
            error: {
              message: error.message,
              name: error.name,
              stack: error.stack,
            },
            success: false,
          });
        },
      }),
    );
  }
}

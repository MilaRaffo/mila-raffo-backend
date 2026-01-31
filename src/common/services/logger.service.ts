import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { format } from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

export enum LogCategory {
  HTTP = 'http',
  ERROR = 'error',
  SECURITY = 'security',
  BUSINESS = 'business',
  DATABASE = 'database',
  SYSTEM = 'system',
}

interface LogMetadata {
  category?: LogCategory;
  userId?: string;
  ip?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
  action?: string;
  resource?: string;
  resourceId?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.metadata(),
      format.json(),
    );

    const consoleFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.colorize({ all: true }),
      format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
      }),
    );

    // Transport para todos los logs
    const combinedTransport = new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'info',
    });

    // Transport para errores
    const errorTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
      level: 'error',
    });

    // Transport para HTTP requests
    const httpTransport = new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat,
      level: 'http',
    });

    // Transport para seguridad
    const securityTransport = new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      format: logFormat,
    });

    // Transport para eventos de negocio
    const businessTransport = new DailyRotateFile({
      filename: 'logs/business-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      format: logFormat,
    });

    // Console transport para desarrollo
    const consoleTransport = new winston.transports.Console({
      format: consoleFormat,
    });

    return winston.createLogger({
      levels: winston.config.npm.levels,
      transports: [
        combinedTransport,
        errorTransport,
        httpTransport,
        consoleTransport,
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, metadata?: LogMetadata) {
    this.logger.info(message, {
      context: this.context,
      ...metadata,
    });
  }

  error(message: string, trace?: string, metadata?: LogMetadata) {
    this.logger.error(message, {
      context: this.context,
      trace,
      ...metadata,
    });
  }

  warn(message: string, metadata?: LogMetadata) {
    this.logger.warn(message, {
      context: this.context,
      ...metadata,
    });
  }

  debug(message: string, metadata?: LogMetadata) {
    this.logger.debug(message, {
      context: this.context,
      ...metadata,
    });
  }

  verbose(message: string, metadata?: LogMetadata) {
    this.logger.verbose(message, {
      context: this.context,
      ...metadata,
    });
  }

  http(message: string, metadata?: LogMetadata) {
    this.logger.log('http', message, {
      context: this.context,
      category: LogCategory.HTTP,
      ...metadata,
    });
  }

  // Métodos específicos por categoría
  security(action: string, metadata?: LogMetadata) {
    this.logger.info(`[SECURITY] ${action}`, {
      context: this.context,
      category: LogCategory.SECURITY,
      action,
      ...metadata,
    });
  }

  business(action: string, metadata?: LogMetadata) {
    this.logger.info(`[BUSINESS] ${action}`, {
      context: this.context,
      category: LogCategory.BUSINESS,
      action,
      ...metadata,
    });
  }

  database(query: string, metadata?: LogMetadata) {
    this.logger.debug(`[DATABASE] ${query}`, {
      context: this.context,
      category: LogCategory.DATABASE,
      query,
      ...metadata,
    });
  }

  // Métodos de conveniencia para eventos de negocio
  orderCreated(orderId: string, userId: string, total: number) {
    this.business('Order Created', {
      resourceId: orderId,
      userId,
      total,
      resource: 'order',
    });
  }

  paymentProcessed(
    paymentId: string,
    orderId: string,
    amount: number,
    status: string,
  ) {
    this.business('Payment Processed', {
      resourceId: paymentId,
      orderId,
      amount,
      status,
      resource: 'payment',
    });
  }

  couponUsed(couponCode: string, userId: string, discount: number) {
    this.business('Coupon Used', {
      couponCode,
      userId,
      discount,
      resource: 'coupon',
    });
  }

  userRegistered(userId: string, email: string) {
    this.security('User Registered', {
      userId,
      email,
      resource: 'user',
    });
  }

  userLogin(userId: string, email: string, ip?: string) {
    this.security('User Login', {
      userId,
      email,
      ip,
      resource: 'user',
    });
  }

  userLogout(userId: string, email: string) {
    this.security('User Logout', {
      userId,
      email,
      resource: 'user',
    });
  }

  accessDenied(userId: string, resource: string, action: string, ip?: string) {
    this.security('Access Denied', {
      userId,
      resource,
      action,
      ip,
    });
  }

  invalidToken(token: string, reason: string, ip?: string) {
    this.security('Invalid Token', {
      token: token.substring(0, 20) + '...',
      reason,
      ip,
    });
  }
}

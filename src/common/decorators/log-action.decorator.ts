import { SetMetadata } from '@nestjs/common';

export const LOG_ACTION_KEY = 'log_action';

export interface LogActionOptions {
  action: string;
  resource: string;
  includeResult?: boolean;
  includeParams?: boolean;
}

/**
 * Decorator to automatically log business actions
 * @param options Action logging configuration
 */
export const LogAction = (options: LogActionOptions) =>
  SetMetadata(LOG_ACTION_KEY, options);

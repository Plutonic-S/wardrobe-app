import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const pinoLogger = pino({
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:mm:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          levelFirst: true,
        },
      }
    : undefined,
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: undefined, // Removes pid and hostname from all logs
});

interface LogContext { [key: string]: unknown }

class Logger {
  private logger = pinoLogger;

  info(message: string, context?: LogContext) {
    this.logger.info(context, message);
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(context, message);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? {
            errorMessage: error.message,
            errorName: error.name,
            stack: error.stack,
          }
        : error 
        ? { errorData: error, stack: new Error().stack }
        : {}),
    };
    this.logger.error(errorContext, message);
  }

  debug(message: string, context?: LogContext) {
    if (isDevelopment) this.logger.debug(context, message);
  }

  // HTTP request logging
  request(method: string, path: string, context?: LogContext) {
    this.info(`→ ${method} ${path}`, { type: 'request', ...context });
  }

  response(
    method: string,
    path: string,
    status: number,
    duration?: number,
    context?: LogContext
  ) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const emoji = status >= 500 ? '✖' : status >= 400 ? '⚠' : '✓';
    
    const logContext = {
      type: 'response',
      status,
      ...(duration ? { duration: `${duration}ms` } : {}),
      ...context,
    };

    this.logger[level](logContext, `${emoji} ${method} ${path} ${status}`);
  }

  // Database logging
  db(message: string, context?: LogContext) {
    this.debug(`[DB] ${message}`, context);
  }

  // Auth logging
  auth(message: string, context?: LogContext) {
    this.info(`[AUTH] ${message}`, context);
  }

  // Child logger for scoped logging
  child(bindings: LogContext) {
    const childLogger = this.logger.child(bindings);
    return {
      info: (msg: string, ctx?: LogContext) => childLogger.info(ctx, msg),
      warn: (msg: string, ctx?: LogContext) => childLogger.warn(ctx, msg),
      error: (msg: string, err?: Error | unknown, ctx?: LogContext) => {
        const errorContext: LogContext = {
          ...ctx,
          ...(err instanceof Error
            ? { errorMessage: err.message, errorName: err.name, stack: err.stack }
            : err 
            ? { errorData: err, stack: new Error().stack }
            : {}),
        };
        childLogger.error(errorContext, msg);
      },
      debug: (msg: string, ctx?: LogContext) => childLogger.debug(ctx, msg),
    };
  }

  // Request/Response wrapper with automatic duration tracking
  createRequestLogger(method: string, path: string, context?: LogContext) {
    const startTime = Date.now();
    
    // Log the incoming request
    this.request(method, path, context);
    
    // Return a function to log the response
    return (status: number, responseContext?: LogContext) => {
      const duration = Date.now() - startTime;
      this.response(method, path, status, duration, {
        ...context,
        ...responseContext,
      });
    };
  }
}

export const logger = new Logger();


// to use it in other files:// import { logger } from '../lib/logger';
// logger.info('This is an info message', { userId: 123 });
// logger.error('This is an error message', new Error('Something went wrong'), { userId: 123 });
// logger.request('GET', '/api/users', { userId: 123 });
// logger.response('GET', '/api/users', 200, 123, { userId: 123 });
// logger.db('Connected to MongoDB', { host: 'localhost', dbName: 'mydb' });
// logger.auth('User login successful', { userId: 123, username: 'johndoe' });

// for the child logger:
// const userLogger = logger.child({ userId: 123 });
// userLogger.info('User-specific info message');
// userLogger.error('User-specific error message', new Error('User error'));
// userLogger.debug('User-specific debug message');
// userLogger.warn('User-specific warning message');

// Request/Response wrapper with automatic duration tracking:
// In your API route:
// export async function GET(request: NextRequest) {
//   const logResponse = logger.createRequestLogger('GET', '/api/users', { userId: 123 });
//   
//   try {
//     // Your route logic here
//     const users = await fetchUsers();
//     
//     logResponse(200, { count: users.length });
//     return NextResponse.json(users);
//   } catch (error) {
//     logResponse(500);
//     return NextResponse.json({ error: 'Failed' }, { status: 500 });
//   }
// }
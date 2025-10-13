// Client-side logger for browser console
// Only works in development mode

const isDev = process.env.NODE_ENV === 'development';

const styles = {
  info: 'color: #3b82f6; font-weight: bold',
  warn: 'color: #f59e0b; font-weight: bold',
  error: 'color: #ef4444; font-weight: bold',
  debug: 'color: #8b5cf6; font-weight: bold',
  success: 'color: #10b981; font-weight: bold',
};

export const clientLogger = {
  info: (message: string, data?: unknown) => {
    if (!isDev) return;
    if (data) {
      console.log(`%c[INFO]%c ${message}`, styles.info, 'color: inherit', data);
    } else {
      console.log(`%c[INFO]%c ${message}`, styles.info, 'color: inherit');
    }
  },

  warn: (message: string, data?: unknown) => {
    if (!isDev) return;
    if (data) {
      console.warn(`%c[WARN]%c ${message}`, styles.warn, 'color: inherit', data);
    } else {
      console.warn(`%c[WARN]%c ${message}`, styles.warn, 'color: inherit');
    }
  },

  error: (message: string, error?: Error | unknown) => {
    if (!isDev) return;
    if (error) {
      console.error(`%c[ERROR]%c ${message}`, styles.error, 'color: inherit', error);
    } else {
      console.error(`%c[ERROR]%c ${message}`, styles.error, 'color: inherit');
    }
  },

  debug: (message: string, data?: unknown) => {
    if (!isDev) return;
    if (data) {
      console.debug(`%c[DEBUG]%c ${message}`, styles.debug, 'color: inherit', data);
    } else {
      console.debug(`%c[DEBUG]%c ${message}`, styles.debug, 'color: inherit');
    }
  },

  success: (message: string, data?: unknown) => {
    if (!isDev) return;
    if (data) {
      console.log(`%c[SUCCESS]%c ${message}`, styles.success, 'color: inherit', data);
    } else {
      console.log(`%c[SUCCESS]%c ${message}`, styles.success, 'color: inherit');
    }
  },
};

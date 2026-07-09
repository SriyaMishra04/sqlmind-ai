type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  info: (message: string, ...args: any[]) => {
    logger.log('info', message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    logger.log('warn', message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    logger.log('error', message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log('debug', message, ...args);
    }
  },

  log: (level: LogLevel, message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
        break;
    }
  }
};

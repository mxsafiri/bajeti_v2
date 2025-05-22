import { logger } from './logger';

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

export function withLogging<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  name: string
): AsyncFunction<T, R> {
  return async function(...args: T): Promise<R> {
    const startTime = Date.now();
    
    try {
      logger.input(name, { args });
      const result = await fn(...args);
      logger.output(name, { 
        duration: `${Date.now() - startTime}ms`,
        result: result instanceof Response ? '[Response]' : result 
      });
      return result;
    } catch (error) {
      logger.error(name, error as Error);
      throw error;
    }
  };
}

export function logComponentRender(componentName: string, props?: any) {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`RENDER:${componentName}`, { 
      props,
      timestamp: new Date().toISOString() 
    });
  }
}

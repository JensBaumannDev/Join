import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler, Injectable } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';

/** Custom global ErrorHandler to filter out harmless browser/router transition abort errors */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /**
   * Inspects errors and silences aborted view transition errors while logging other exceptions.
   * 
   * @param error - The error or exception object to handle.
   */
  handleError(error: any): void {
    const message = error?.message || String(error);
    if (
      message.includes('Transition was aborted') ||
      message.includes('Transition was skipped') ||
      (error?.name === 'InvalidStateError' && message.includes('invalid state'))
    ) {
      return;
    }
    console.error(error);
  }
}

/** Application configuration setup including routing strategies and error listeners */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};


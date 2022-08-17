import { container } from 'tsyringe';
import type { createApp } from 'vue';

import { DatabaseConnectionError } from 'model/error';
import RouterService from './RouterService';

export default class ErrorService {
  private readonly router = container.resolve(RouterService);
  private handler = (e: Error) => {
    if (e instanceof DatabaseConnectionError) {
      this.router.guideView.value = true;
      return;
    }

    console.log(e);
  };

  constructor(vueApp: ReturnType<typeof createApp>) {
    window.addEventListener('error', (e) => this.handler(e.error));
    window.addEventListener('unhandledrejection', (e) =>
      this.handler(e.reason instanceof Error ? e.reason : new Error(e.reason)),
    );
    vueApp.config.errorHandler = (e) =>
      this.handler(e instanceof Error ? e : new Error(String(e)));
  }
}

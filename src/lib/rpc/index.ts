import { isResponse, Request, isRequest } from './protocol';

export function expose<T>(value: T): void {
  if (!value) {
    return;
  }

  chrome.runtime.onMessage.addListener(
    (message: Request | undefined, sender, sendBack) => {
      if (
        !isRequest(message) ||
        typeof (value as any)[message.path] !== 'function'
      ) {
        return;
      }

      let result: any;

      try {
        result = (value as any)[message.path](...message.args, sender);
      } catch (error) {
        sendBack({
          isError: true,
          payload: error,
        });
      }

      Promise.resolve(result).then(
        (result) => {
          sendBack({ isError: false, payload: result });
        },
        (e) => {
          sendBack({ isError: true, payload: e });
        },
      );

      return true;
    },
  );
}

export function wrap<T>(
  options: {
    endPoint: { sendMessage: (...args: any[]) => Promise<any> };
    target?: any;
  },
  path?: string,
): T {
  return new Proxy(() => {}, {
    get(_, key) {
      if (typeof key !== 'string') {
        throw new Error('un supported key type');
      }

      return wrap(options, key);
    },
    async apply(_1, _2, args) {
      let { target } = options;

      if (typeof options.target === 'function') {
        target = options.target();
      }

      if (target instanceof Promise) {
        target = await target;
      }

      if (!path) {
        throw new Error('no path');
      }

      const res = await (typeof target === 'undefined'
        ? options.endPoint.sendMessage({ path, args })
        : options.endPoint.sendMessage(target, { path, args }));

      if (!isResponse(res)) {
        throw new Error('not a response');
      }

      if (res.isError) {
        throw new Error(res ? res.payload : 'no response');
      }

      return res.payload;
    },
  }) as unknown as T;
}

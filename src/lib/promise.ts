type Callable = (...args: any[]) => any;

export const timeout = <T>(
  p: Promise<T>,
  timeout: number,
  onTimeout?: Callable,
) => {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(reject, timeout)),
  ]).catch(onTimeout);
};

export const delay = (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

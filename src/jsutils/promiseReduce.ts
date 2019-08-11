// @ts-ignore
import isPromise from './isPromise.ts'
// @ts-ignore
import { PromiseOrValue } from './PromiseOrValue.ts';

/**
 * Similar to Array.prototype.reduce(), however the reducing callback may return
 * a Promise, in which case reduction will continue after each promise resolves.
 *
 * If the callback does not return a Promise, then this function will also not
 * return a Promise.
 */
export default function promiseReduce<T, U>(
  values: ReadonlyArray<T>,
  callback: (arg0: U, arg1: T) => PromiseOrValue<U>,
  initialValue: PromiseOrValue<U>,
): PromiseOrValue<U> {
  return values.reduce(
    (previous, value) =>
      isPromise(previous)
        ? previous.then(resolved => callback(resolved, value))
        : callback(previous, value),
    initialValue,
  );
}

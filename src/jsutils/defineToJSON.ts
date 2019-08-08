// @ts-ignore
import nodejsCustomInspectSymbol from './nodejsCustomInspectSymbol.ts';

/**
 * The `defineToJSON()` function defines toJSON() and inspect() prototype
 * methods, if no function provided they become aliases for toString().
 */
export default function defineToJSON(
  classObject,
  fn = classObject.prototype.toString,
) {
  classObject.prototype.toJSON = fn;
  classObject.prototype.inspect = fn;
  if (nodejsCustomInspectSymbol) {
    classObject.prototype[nodejsCustomInspectSymbol] = fn;
  }
}

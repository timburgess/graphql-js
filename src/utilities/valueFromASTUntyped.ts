// @ts-ignore
import inspect from '../jsutils/inspect.ts';
// @ts-ignore
import invariant from '../jsutils/invariant.ts';
// @ts-ignore
import keyValMap from '../jsutils/keyValMap.ts';
// @ts-ignore
import isInvalid from '../jsutils/isInvalid.ts';
// @ts-ignore
import { ObjMap } from '../jsutils/ObjMap.ts';

// @ts-ignore
import { Kind } from '../language/kinds.ts';
// @ts-ignore
import { ValueNode } from '../language/ast.ts';

/**
 * Produces a JavaScript value given a GraphQL Value AST.
 *
 * Unlike `valueFromAST()`, no type is provided. The resulting JavaScript value
 * will reflect the provided GraphQL value AST.
 *
 * | GraphQL Value        | JavaScript Value |
 * | -------------------- | ---------------- |
 * | Input Object         | Object           |
 * | List                 | Array            |
 * | Boolean              | Boolean          |
 * | String / Enum        | String           |
 * | Int / Float          | Number           |
 * | Null                 | null             |
 *
 */
export function valueFromASTUntyped(
  valueNode: ValueNode,
  variables?: ObjMap<unknown> | null,
): unknown {
  switch (valueNode.kind) {
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(valueNode.value, 10);
    case Kind.FLOAT:
      return parseFloat(valueNode.value);
    case Kind.STRING:
    case Kind.ENUM:
    case Kind.BOOLEAN:
      return valueNode.value;
    case Kind.LIST:
      return valueNode.values.map(node => valueFromASTUntyped(node, variables));
    case Kind.OBJECT:
      return keyValMap(
        valueNode.fields,
        field => field.name.value,
        field => valueFromASTUntyped(field.value, variables),
      );
    case Kind.VARIABLE: {
      const variableName = valueNode.name.value;
      return variables && !isInvalid(variables[variableName])
        ? variables[variableName]
        : undefined;
    }
  }

  // Not reachable. All possible value nodes have been considered.
  invariant(false, 'Unexpected value node: ' + inspect(valueNode as never));
}

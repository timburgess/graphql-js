// @ts-ignore
import {
    forEach,
    isCollection,
} from 'https://unpkg.com/iterall@1.2.2/index.mjs';

// @ts-ignore
import inspect from '../jsutils/inspect.ts';
// @ts-ignore
import invariant from '../jsutils/invariant.ts';
// @ts-ignore
import isNullish from '../jsutils/isNullish.ts';
// @ts-ignore
import isInvalid from '../jsutils/isInvalid.ts';
// @ts-ignore
import isObjectLike from '../jsutils/isObjectLike.ts';

// @ts-ignore
import { Kind } from '../language/kinds.ts';
// @ts-ignore
import { ValueNode } from '../language/ast.ts';

import { GraphQLID } from '../type/scalars.ts';
import {
  GraphQLInputType,
  isLeafType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
} from '../type/definition';

/**
 * Produces a GraphQL Value AST given a JavaScript value.
 *
 * A GraphQL type must be provided, which will be used to interpret different
 * JavaScript values.
 *
 * | JSON Value    | GraphQL Value        |
 * | ------------- | -------------------- |
 * | Object        | Input Object         |
 * | Array         | List                 |
 * | Boolean       | Boolean              |
 * | String        | String / Enum Value  |
 * | Number        | Int / Float          |
 * | Mixed         | Enum Value           |
 * | null          | NullValue            |
 *
 */
export function astFromValue(
  value: unknown,
  type: GraphQLInputType,
): ValueNode | null {
  if (isNonNullType(type)) {
    const astValue = astFromValue(value, type.ofType);
    if (astValue && astValue.kind === Kind.NULL) {
      return null;
    }
    return astValue;
  }

  // only explicit null, not undefined, NaN
  if (value === null) {
    return { kind: Kind.NULL };
  }

  // undefined, NaN
  if (isInvalid(value)) {
    return null;
  }

  // Convert JavaScript array to GraphQL list. If the GraphQLType is a list, but
  // the value is not an array, convert the value using the list's item type.
  if (isListType(type)) {
    const itemType = type.ofType;
    if (isCollection(value)) {
      const valuesNodes = [];
      forEach(value as any, item => {
        const itemNode = astFromValue(item, itemType);
        if (itemNode) {
          valuesNodes.push(itemNode);
        }
      });
      return { kind: Kind.LIST, values: valuesNodes };
    }
    return astFromValue(value, itemType);
  }

  // Populate the fields of the input object by creating ASTs from each value
  // in the JavaScript object according to the fields in the input type.
  if (isInputObjectType(type)) {
    if (!isObjectLike(value)) {
      return null;
    }
    const fieldNodes = [];
    for (const field of Object.values(type.getFields())) {
      const fieldValue = astFromValue(value[field.name], field.type);
      if (fieldValue) {
        fieldNodes.push({
          kind: Kind.OBJECT_FIELD,
          name: { kind: Kind.NAME, value: field.name },
          value: fieldValue,
        });
      }
    }
    return { kind: Kind.OBJECT, fields: fieldNodes };
  }

  if (isLeafType(type)) {
    // Since value is an internally represented value, it must be serialized
    // to an externally represented value before converting into an AST.
    const serialized = type.serialize(value);
    if (isNullish(serialized)) {
      return null;
    }

    // Others serialize based on their corresponding JavaScript scalar types.
    if (typeof serialized === 'boolean') {
      return { kind: Kind.BOOLEAN, value: serialized };
    }

    // JavaScript numbers can be Int or Float values.
    if (typeof serialized === 'number') {
      const stringNum = String(serialized);
      return integerStringRegExp.test(stringNum)
        ? { kind: Kind.INT, value: stringNum }
        : { kind: Kind.FLOAT, value: stringNum };
    }

    if (typeof serialized === 'string') {
      // Enum types use Enum literals.
      if (isEnumType(type)) {
        return { kind: Kind.ENUM, value: serialized };
      }

      // ID types can use Int literals.
      if (type === GraphQLID && integerStringRegExp.test(serialized)) {
        return { kind: Kind.INT, value: serialized };
      }

      return {
        kind: Kind.STRING,
        value: serialized,
      };
    }

    throw new TypeError(`Cannot convert value to AST: ${inspect(serialized)}`);
  }

  // Not reachable. All possible input types have been considered.
  invariant(false, 'Unexpected input type: ' + inspect(type as never));
}

/**
 * IntValue:
 *   - NegativeSign? 0
 *   - NegativeSign? NonZeroDigit ( Digit+ )?
 */
const integerStringRegExp = /^-?(?:0|[1-9][0-9]*)$/;

// @ts-ignore
import inspect from '../jsutils/inspect.ts';
// @ts-ignore
import keyMap from '../jsutils/keyMap.ts';
// @ts-ignore
import mapValue from '../jsutils/mapValue.ts';
// @ts-ignore
import { Path } from '../jsutils/Path.ts';
// @ts-ignore
import devAssert from '../jsutils/devAssert.ts';
// @ts-ignore
import keyValMap from '../jsutils/keyValMap.ts';
// @ts-ignore
import { ObjMap } from '../jsutils/ObjMap.ts';
// @ts-ignore
import instanceOf from '../jsutils/instanceOf.ts';
// @ts-ignore
import isObjectLike from '../jsutils/isObjectLike.ts';
// @ts-ignore
import identityFunc from '../jsutils/identityFunc.ts';
// @ts-ignore
import defineToJSON from '../jsutils/defineToJSON.ts';
// @ts-ignore
import defineToStringTag from '../jsutils/defineToStringTag.ts';
// @ts-ignore
import { PromiseOrValue } from '../jsutils/PromiseOrValue.ts';

// @ts-ignore
import { Kind } from '../language/kinds.ts';
import {
  ScalarTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  UnionTypeDefinitionNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  InputObjectTypeDefinitionNode,
  ScalarTypeExtensionNode,
  ObjectTypeExtensionNode,
  InterfaceTypeExtensionNode,
  UnionTypeExtensionNode,
  EnumTypeExtensionNode,
  InputObjectTypeExtensionNode,
  OperationDefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  ValueNode,
  // @ts-ignore
} from '../language/ast.ts';

// @ts-ignore
import { valueFromASTUntyped } from '../utilities/valueFromASTUntyped.ts';

// import { GraphQLSchema } from './schema';

// Predicates & Assertions

/**
 * These are all of the possible kinds of types.
 */
export type GraphQLType =
  | GraphQLScalarType
  // | GraphQLObjectType
  // | GraphQLInterfaceType
  // | GraphQLUnionType
  // | GraphQLEnumType
  // | GraphQLInputObjectType
  // | GraphQLList<any>
  // | GraphQLNonNull<any>;

export function isType(type: unknown): boolean {
  return (
    isScalarType(type)
    // isObjectType(type) ||
    // isInterfaceType(type) ||
    // isUnionType(type) ||
    // isEnumType(type) ||
    // isInputObjectType(type) ||
    // isListType(type) ||
    // isNonNullType(type)
  );
}

export function assertType(type: unknown): GraphQLType {
  if (!isType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL type.`);
  }
  // @ts-ignore
  return type;
}

/**
 * There are predicates for each kind of GraphQL type.
 */

// declare function isScalarType(type: mixed): boolean %checks(type instanceof
//   GraphQLScalarType);
// eslint-disable-next-line no-redeclare
export function isScalarType(type: unknown): boolean {
  return instanceOf(type, GraphQLScalarType);
}

export function assertScalarType(type: unknown): GraphQLScalarType {
  if (!isScalarType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Scalar type.`);
  }
  // @ts-ignore
  return type;
}


function undefineIfEmpty<T>(
  arr: ReadonlyArray<T> | null,
): ReadonlyArray<T> | null {
  return arr && arr.length > 0 ? arr : undefined;
}


/**
 * Scalar Type Definition
 *
 * The leaf values of any request and input values to arguments are
 * Scalars (or Enums) and are defined with a name and a series of functions
 * used to parse input from ast or variables and to ensure validity.
 *
 * If a type's serialize function does not return a value (i.e. it returns
 * `undefined`) then an error will be raised and a `null` value will be returned
 * in the response. If the serialize function returns `null`, then no error will
 * be included in the response.
 *
 * Example:
 *
 *     const OddType = new GraphQLScalarType({
 *       name: 'Odd',
 *       serialize(value) {
 *         if (value % 2 === 1) {
 *           return value;
 *         }
 *       }
 *     });
 *
 */
export class GraphQLScalarType {
  name: string;
  description: string | null;
  serialize: GraphQLScalarSerializer<any>;
  parseValue: GraphQLScalarValueParser<any>;
  parseLiteral: GraphQLScalarLiteralParser<any>;
  astNode: ScalarTypeDefinitionNode | null;
  extensionASTNodes: ReadonlyArray<ScalarTypeExtensionNode> | null;

  constructor(config: GraphQLScalarTypeConfig<any, any>) {
    const parseValue = config.parseValue || identityFunc;
    this.name = config.name;
    this.description = config.description;
    this.serialize = config.serialize || identityFunc;
    this.parseValue = parseValue;
    this.parseLiteral =
      config.parseLiteral || (node => parseValue(valueFromASTUntyped(node)));

    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);
    devAssert(typeof config.name === 'string', 'Must provide name.');
    devAssert(
      config.serialize == null || typeof config.serialize === 'function',
      `${this.name} must provide "serialize" function. If this custom Scalar is also used as an input type, ensure "parseValue" and "parseLiteral" functions are also provided.`,
    );

    if (config.parseLiteral) {
      devAssert(
        typeof config.parseValue === 'function' &&
          typeof config.parseLiteral === 'function',
        `${this.name} must provide both "parseValue" and "parseLiteral" functions.`,
      );
    }
  }

  toConfig(): GraphQLScalarTypeConfig<any, any> & {
    serialize: GraphQLScalarSerializer<any>;
    parseValue: GraphQLScalarValueParser<any>;
    parseLiteral: GraphQLScalarLiteralParser<any>;
    extensionASTNodes: ReadonlyArray<ScalarTypeExtensionNode>;
  } {
    return {
      name: this.name,
      description: this.description,
      serialize: this.serialize,
      parseValue: this.parseValue,
      parseLiteral: this.parseLiteral,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes || [],
    };
  }

  toString(): string {
    return this.name;
  }
}

// Conditionally apply `[Symbol.toStringTag]` if `Symbol`s are supported
defineToStringTag(GraphQLScalarType);
defineToJSON(GraphQLScalarType);

export type GraphQLScalarSerializer<TExternal> = (
  value: unknown,
) => TExternal | null;
export type GraphQLScalarValueParser<TInternal> = (
  value: unknown,
) => TInternal | null;
export type GraphQLScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: ObjMap<unknown> | null,
) => TInternal | null;

export type GraphQLScalarTypeConfig<TInternal, TExternal> = {
  name: string;
  description?: string | null;
  // Serializes an internal value to include in a response.
  serialize?: GraphQLScalarSerializer<TExternal>;
  // Parses an externally provided value to use as an input.
  parseValue?: GraphQLScalarValueParser<TInternal>;
  // Parses an externally provided literal value to use as an input.
  parseLiteral?: GraphQLScalarLiteralParser<TInternal>;
  astNode?: ScalarTypeDefinitionNode | null;
  extensionASTNodes?: ReadonlyArray<ScalarTypeExtensionNode> | null;
};


// @ts-ignore
// import {
//   $Shape,
//   $Keys,
// } from 'https://raw.githubusercontent.com/timburgess/utility-types/deno/src/utility-types.ts';

// import inspect from '../jsutils/inspect.ts';

import { TypeInfo } from '../utilities/TypeInfo.ts';

import { ASTNode, ASTKindToNode } from './ast.ts';

type $Keys<T extends object> = keyof T
type $Values<T extends object> = T[keyof T]
type $Shape<T extends object> = Partial<T>
/**
 * A visitor is provided to visit, it contains the collection of
 * relevant functions to be called during the visitor's traversal.
 */
export type ASTVisitor = Visitor<ASTKindToNode>;
export type Visitor<KindToNode, Nodes = $Values<KindToNode>> =
  | EnterLeave<
      | VisitFn<Nodes>
      | ShapeMap<KindToNode, <Node>(arg0: Node) => VisitFn<Nodes, Node>>
    >
  | ShapeMap<
      KindToNode,
      <Node>(
        arg0: Node,
      ) => VisitFn<Nodes, Node> | EnterLeave<VisitFn<Nodes, Node>>
    >;
type EnterLeave<T> = { readonly enter?: T; readonly leave?: T };
type ShapeMap<O, F> = $Shape<$ObjMap<O, F>>;

/**
 * A visitor is comprised of visit functions, which are called on each node
 * during the visitor's traversal.
 */
export type VisitFn<TAnyNode, TVisitedNode extends TAnyNode = TAnyNode> = (
  // The current node being visiting.
  node: TVisitedNode, // The index or key to this node from the parent node or Array.
  key: string | number | void, // The parent immediately above this node, which may be an Array.
  parent: TAnyNode | ReadonlyArray<TAnyNode> | void, // The key path to get to this node from the root node.
  path: ReadonlyArray<string | number>, // All nodes and Arrays visited before reaching parent of this node.
  // These correspond to array indices in `path`.
  // Note: ancestors includes arrays which contain the parent of visited node.
  ancestors: ReadonlyArray<TAnyNode | ReadonlyArray<TAnyNode>>,
) => any;

/**
 * A KeyMap describes each the traversable properties of each kind of node.
 */
export type VisitorKeyMap<KindToNode> = $ObjMap<
  KindToNode,
  <T>(arg0: T) => ReadonlyArray<$Keys<T>>
>;


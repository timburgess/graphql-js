// @ts-ignore
import isObjectLike from '../jsutils/isObjectLike.ts'

// import { ASTNode } from '../language/ast.ts'
// @ts-ignore
import { SourceLocation, getLocation } from '../language/location.ts';
import {
  printLocation,
  printSourceLocation,
  // @ts-ignore
} from '../language/printLocation.ts';

/**
 * A GraphQLError describes an Error found during the parse, validate, or
 * execute phases of performing a GraphQL operation. In addition to a message
 * and stack trace, it also includes information about the locations in a
 * GraphQL document and/or execution result that correspond to the Error.
 */
// FIXME
export function GraphQLError( // eslint-disable-line no-redeclare
  message,
  nodes,
  source,
  positions,
  path?: Array<string | number>,
  originalError?: any,
  extensions?: Array<any>,
) {
  // Compute list of blame nodes.
  const _nodes = Array.isArray(nodes)
    ? nodes.length !== 0
      ? nodes
      : undefined
    : nodes
    ? [nodes]
    : undefined;

  // Compute locations in the source for the given nodes/positions.
  let _source = source;
  if (!_source && _nodes) {
    const node = _nodes[0];
    _source = node && node.loc && node.loc.source;
  }

  let _positions = positions;
  if (!_positions && _nodes) {
    _positions = _nodes.reduce((list, node) => {
      if (node.loc) {
        list.push(node.loc.start);
      }
      return list;
    }, []);
  }
  if (_positions && _positions.length === 0) {
    _positions = undefined;
  }

  let _locations;
  if (positions && source) {
    _locations = positions.map(pos => getLocation(source, pos));
  } else if (_nodes) {
    _locations = _nodes.reduce((list, node) => {
      if (node.loc) {
        list.push(getLocation(node.loc.source, node.loc.start));
      }
      return list;
    }, []);
  }

  let _extensions = extensions;
  if (_extensions == null && originalError != null) {
    const originalExtensions = originalError.extensions;
    if (isObjectLike(originalExtensions)) {
      _extensions = originalExtensions;
    }
  }

  Object.defineProperties(this, {
    message: {
      value: message,
      // By being enumerable, JSON.stringify will include `message` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: true,
      writable: true,
    },
    locations: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: _locations || undefined,
      // By being enumerable, JSON.stringify will include `locations` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: Boolean(_locations),
    },
    path: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: path || undefined,
      // By being enumerable, JSON.stringify will include `path` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: Boolean(path),
    },
    nodes: {
      value: _nodes || undefined,
    },
    source: {
      value: _source || undefined,
    },
    positions: {
      value: _positions || undefined,
    },
    originalError: {
      value: originalError,
    },
    extensions: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: _extensions || undefined,
      // By being enumerable, JSON.stringify will include `path` in the
      // resulting output. This ensures that the simplest possible GraphQL
      // service adheres to the spec.
      enumerable: Boolean(_extensions),
    },
  });

  // Include (non-enumerable) stack trace.
  if (originalError && originalError.stack) {
    Object.defineProperty(this, 'stack', {
      value: originalError.stack,
      writable: true,
      configurable: true,
    });
  // FIXME: Node
  // } else if (Error.captureStackTrace) {
  //   Error.captureStackTrace(this, GraphQLError);
  } else {
    Object.defineProperty(this, 'stack', {
      value: Error().stack,
      writable: true,
      configurable: true,
    });
  }
}

GraphQLError.prototype = Object.create(Error.prototype, {
  constructor: { value: GraphQLError },
  name: { value: 'GraphQLError' },
  toString: {
    value: function toString() {
      return printError(this);
    },
  },
});

/**
 * Prints a GraphQLError to a string, representing useful location information
 * about the error's position in the source.
 */
export function printError(error) {
  let output = error.message;

  if (error.nodes) {
    for (const node of error.nodes) {
      if (node.loc) {
        output += '\n\n' + printLocation(node.loc);
      }
    }
  } else if (error.source && error.locations) {
    for (const location of error.locations) {
      output += '\n\n' + printSourceLocation(error.source, location);
    }
  }

  return output;
}

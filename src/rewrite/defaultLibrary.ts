import ts from 'typescript';
import { builders as b, namedTypes as n } from 'ast-types';
import K from 'ast-types/gen/kinds';
import {
  Converter,
  ErrorOr,
  mkError,
  mkSuccess,
  mkUnimplemented,
} from '../convert';
import {
  mkNamespaceRewrite,
  mkTypeMacro,
  mkTypeReferenceMacro,
  prepImportSubstitute,
} from './core';
import { formatSyntaxKind } from '../tsdebug';

function convertRecord(
  converter: Converter,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
): ErrorOr<K.FlowTypeKind> {
  if (typeArguments?.length !== 2) {
    return mkError(
      `bad Record: ${typeArguments?.length ?? 0} arguments (expected 2)`,
    );
  }
  const [keysType, valueType] = typeArguments;

  if (keysType.kind === ts.SyntaxKind.StringKeyword) {
    return buildAsIndexer(b.stringTypeAnnotation());
  } else if (keysType.kind === ts.SyntaxKind.NumberKeyword) {
    return buildAsIndexer(b.numberTypeAnnotation());
  } else if (ts.isLiteralTypeNode(keysType)) {
    const { literal } = keysType;
    if (ts.isStringLiteral(literal)) {
      return buildAsProperties([b.stringLiteral(literal.text)]);
    } else if (ts.isNumericLiteral(literal)) {
      // There doesn't seem to be a syntax in Flow to express the number
      // itself as a key.  Use its text form instead -- this exactly
      // describes the actual runtime behavior, though it might cause
      // hiccups interoperating with other types.
      // TODO(error): Annotate this with a warning.
      return buildAsProperties([b.stringLiteral(literal.text)]);
    } else {
      return mkUnimplemented(
        `Record with key literal type ${formatSyntaxKind(literal.kind)}`,
      );
    }
  } else if (ts.isUnionTypeNode(keysType)) {
    const keys = [];
    for (const type of keysType.types) {
      // TODO perhaps try to ask the type-checker what this type resolved
      //   to, rather than walk it syntactically?  Would mean automatically
      //   handling e.g. nested unions, and type aliases.
      if (!ts.isLiteralTypeNode(type)) {
        return mkUnimplemented(
          `Record with union member ${formatSyntaxKind(type.kind)}`,
        );
      }
      const { literal } = type;
      if (!ts.isStringLiteral(literal) && !ts.isNumericLiteral(literal)) {
        return mkUnimplemented(
          `Record with union member literal type ${formatSyntaxKind(
            literal.kind,
          )}`,
        );
      }
      keys.push(b.stringLiteral(literal.text));
    }
    return buildAsProperties(keys);
  } else {
    return mkUnimplemented(
      `Record with key type ${formatSyntaxKind(keysType.kind)}`,
    );
  }

  function buildAsIndexer(keyType: K.FlowTypeKind) {
    const indexer = b.objectTypeIndexer(
      b.identifier('key'), // TODO(ast-types): this should be omitted
      keyType,
      converter.convertType(valueType),
    );
    return mkSuccess(b.objectTypeAnnotation([], [indexer]));
  }

  function buildAsProperties(keys: (K.IdentifierKind | K.LiteralKind)[]) {
    const value = converter.convertType(valueType);
    const properties = keys.map((k) => b.objectTypeProperty(k, value, false));
    return mkSuccess(b.objectTypeAnnotation(properties));
  }
}

function convertOmit(
  converter: Converter,
  typeName: ts.EntityNameOrEntityNameExpression,
  typeArguments: ts.NodeArray<ts.TypeNode> | void,
): ErrorOr<{
  id: K.IdentifierKind | n.QualifiedTypeIdentifier;
  typeParameters: n.TypeParameterInstantiation | null;
}> {
  if (typeArguments?.length !== 2) {
    return mkError(
      `bad Omit: ${typeArguments?.length ?? 0} arguments (expected 2)`,
    );
  }
  const [objectType, keysType] = typeArguments;

  let subtrahend;
  if (ts.isLiteralTypeNode(keysType) && ts.isStringLiteral(keysType.literal)) {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: [
        b.objectTypeProperty(
          b.stringLiteral(keysType.literal.text),
          b.mixedTypeAnnotation(),
          false,
        ),
      ],
    });
  } else if (
    ts.isUnionTypeNode(keysType) &&
    keysType.types.every(
      (t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal),
    )
  ) {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: keysType.types.map((t) =>
        b.objectTypeProperty(
          b.stringLiteral(
            ((t as ts.LiteralTypeNode).literal as ts.StringLiteral).text,
          ),
          b.mixedTypeAnnotation(),
          false,
        ),
      ),
    });
  } else {
    subtrahend = b.objectTypeAnnotation.from({
      exact: true,
      properties: [],
      indexers: [
        b.objectTypeIndexer(
          b.identifier('key'),
          converter.convertType(keysType),
          b.mixedTypeAnnotation(),
        ),
      ],
    });
  }

  return mkSuccess({
    id: b.identifier('$Diff'),
    typeParameters: b.typeParameterInstantiation([
      converter.convertType(objectType),
      subtrahend,
    ]),
  });
}

/**
 * Our static rewrite plans for the TS "default library", i.e. stdlib.
 */
export function prepDefaultLibraryRewrites() {
  return mkNamespaceRewrite({
    Record: mkTypeMacro(convertRecord),
    Omit: mkTypeReferenceMacro(convertOmit),

    // TODO: Have the mapper find these import substitutions directly from
    //   the declarations in subst/react.js.flow, rather than list them here
    ...Object.fromEntries(
      ['Readonly', 'ReadonlyArray', 'Partial'].map((name) => [
        name,
        // No need to munge the names of these; the input code won't have
        // had to import them, so won't have a chance to pick a different
        // name.  Keep TS's name, and just supply a Flow definition.
        prepImportSubstitute(name, `${name}`, 'tsflower/subst/lib'),
      ]),
    ),

    // If adding to this: note that any `namespaces` map is ignored.
    // See findRewritesInDefaultLibrary.
  });
}

import {
  mapOfObject,
  mkNamespaceRewrite,
  NamespaceRewrite,
} from './rewrite/core';
import { prepDefaultLibraryRewrites } from './rewrite/defaultLibrary';
import { prepGlobalJsxRewrites, prepReactRewrites } from './rewrite/react';
import { prepReactNativeRewrites } from './rewrite/reactNative';
import { prepGlobalReactNavigationRewrites } from './rewrite/rewriteMisc';

export type { NamespaceRewrite, TypeRewrite } from './rewrite/core';

export const defaultLibraryRewrites: NamespaceRewrite =
  prepDefaultLibraryRewrites();

export const globalRewrites: NamespaceRewrite = mkNamespaceRewrite(undefined, {
  // If adding to this: note the unimplemented cases in findGlobalRewrites,
  // where we use this map.
  JSX: prepGlobalJsxRewrites(),
  ReactNavigation: prepGlobalReactNavigationRewrites(),
});

export const libraryRewrites: Map<string, NamespaceRewrite> = mapOfObject({
  // If adding to this: note that currently any namespace rewrites within a
  // given library are ignored!  That is, the `namespaces` property of one
  // of these NamespaceRewrite values is never consulted.  See use sites.

  // All from `@types/react/index.d.ts`.
  react: prepReactRewrites(),

  'react-native': prepReactNativeRewrites(),
});

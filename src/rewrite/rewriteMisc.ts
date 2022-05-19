import { mkNamespaceRewrite, prepImportSubstitute } from './core';

const prefixReactNav = '$tsflower_subst$react_navigation$';

/** Rewrites for the global namespace `ReactNavigation`. */
export function prepGlobalReactNavigationRewrites() {
  return mkNamespaceRewrite({
    RootParamList: prepImportSubstitute(
      'ReactNavigation_RootParamList',
      prefixReactNav + 'ReactNavigation_RootParamList',
      'tsflower/subst/react-navigation',
    ),
  });
}

import { mkNamespaceRewrite, prepSubstituteType } from './core';

const prefixReactNav = '$tsflower_subst$react_navigation$';

/** Rewrites for the global namespace `ReactNavigation`. */
export function prepGlobalReactNavigationRewrites() {
  return mkNamespaceRewrite({
    // From @react-navigation/core/src/types.tsx:
    //   declare global {
    //     namespace ReactNavigation {
    //       interface RootParamList {}
    //
    // The purpose is apparently to let an application inject into that
    // interface globally, with their own `declare global`.  Upstream docs:
    //   https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
    //
    // Nasty.  Fortunately we can safely assume that isn't happening:
    // libraries wisely leave it up to the app to make such an injection
    // (because it's all about the app's particular routes), and if you're
    // using TsFlower then your app is in Flow.  So make it an empty
    // interface, for the sake of successfully translating other parts of
    // React Navigation that refer to this global name.
    RootParamList: prepSubstituteType(
      prefixReactNav + 'ReactNavigation_RootParamList',
      // TODO: or `interface {}`?  But library code tries to have it
      //   upper-bounded by `{}`.  Perhaps emit type literals as interfaces?
      (name) => `type ${name} = { ... };`,
    ),
  });
}

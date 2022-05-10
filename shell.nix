# All our non-NPM dependencies and dev-dependencies, expressed with Nix.
#
# If you're using NixOS, this file may be helpful:
#  * Type `nix-shell` in this directory.
#  * You'll get a shell with the environment all set up
#    so that `yarn install && yarn test` works.
#
# If you're using any other Linux distro, or macOS, then you almost
# certainly have the more obscure of these dependencies already
# (ncurses, and the C++ standard library.)

{ pkgs ? import <nixpkgs> {} }:
with pkgs;
mkShell {

  LD_LIBRARY_PATH = lib.makeLibraryPath [
    gcc11.cc  # Needed by Flow (the one from NPM.)
  ];

  nativeBuildInputs = [
    nodejs-16_x

    # yarn  # This is fine once `yarn` gets a Node 16+.

    # This would be fine but for: https://github.com/NixOS/nixpkgs/issues/145432
    # nodejs-16_x.pkgs.yarn

    # This wraps nodejs-16_x.pkgs.yarn to work around that issue.
    (runCommand "yarn" { } ''
      mkdir -p "$out/bin"
      ln -s '${nodejs-16_x.pkgs.yarn}/lib/node_modules/yarn/bin/yarn' "$out/bin/"
    '')

    git  # Used by t/run
    ncurses  # Used by Flow (via the `tset` binary)
  ];
}

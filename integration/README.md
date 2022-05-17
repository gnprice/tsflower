# Integration tests for TsFlower

Currently these are more a set of data for exploration than an automated
test suite; there's no one script that reports pass or fail.  (The unit
tests in `/t/` are for that.)

To run TsFlower on some package:

    $ bin/tsflower tree integration/{node_modules,types}/react-native-gesture-handler

To run it on a selected suite of packages:

    $ integration/run

To see TsFlower errors in the generated output:

    $ grep -RohP 'tsflower-.*?(\*/| at )' integration/types/ | sort | uniq -c | sort -n

… and Flow errors:

    $ npx flow integration/

      # Count how many errors there are
    $ npx flow integration/ --json | jq '.errors | length'

      # See a summary of error messages
    $ npx flow integration/ --json | jq '.errors[] | .message[0].descr' -r \
      | perl -pe 's/(.*?)(?: \[([a-z-]*)\])?$/[$2] $1/' | sort | uniq -c
      # Or drop `| uniq -c` if it's not too long.
      # Make your terminal wide, or add `| less -SFX`.

      # … or of error codes
    $ npx flow integration/ --json | jq '.errors[] | .error_codes' -c | sort | uniq -c

      # See a summary of missing imports
    $ npx flow integration/ --json | jq '.errors[] | .message[0].descr' -r \
      | perl -lne 'print "$2 $1" if (/`(\w+)` is missing in module `(.*?)`/
                                  || /no `(\w+)` export in `(.*?)`/)
          ' | LC_ALL=C sort | uniq -c

      # See all errors, in a pager
    $ npx flow integration/ --show-all-errors --color=always | less -j3 +G
      # The `+G` works around an annoying Flow CLI bug on broken pipe.
      #   (If you skip it and hit that bug, run `stty sane` to fix.)
      # The `-j3` is handy when searching for an error message: it makes
      #   the filename appear in view.

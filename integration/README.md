# Integration tests for TsFlower

Currently these are more a set of data for exploration than an automated
test suite; there's no one script that reports pass or fail.  (The unit
tests in `/t/` are for that.)

To run TsFlower on some package:

    $ bin/tsflower tree integration/{node_modules,types}/react-native-gesture-handler

To see errors in that package:

    $ grep -RohP 'tsflower-.*?(\*/| at )' integration/types/react-native-gesture-handler/ | sort | uniq -c | sort -n

To run Flow on the generated output:

    $ npx flow integration/

Further handy Flow commands:

      # Count how many errors there are
    $ npx flow integration/ --json | jq '.errors | length'

      # See a summary of error messages
    $ npx flow integration/ --json | jq '.errors[] | .message[0].descr' -r | sort | uniq -c
      # Or drop `| uniq -c` if it's not too long.
      # Make your terminal wide, or add `| less -SFX`.

      # See all errors, in a pager
    $ npx flow integration/ --show-all-errors --color=always | less -j3 +G
      # The `+G` works around an annoying Flow CLI bug on broken pipe.
      #   (If you skip it and hit that bug, run `stty sane` to fix.)
      # The `-j3` is handy when searching for an error message: it makes
      #   the filename appear in view.

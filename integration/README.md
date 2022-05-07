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

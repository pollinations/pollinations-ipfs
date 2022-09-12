#!/bin/bash

# run ./test_ipfs.sh 100 times printing times for each
for i in {1..100}
do
    echo -n "run $i "
    TIMEFORMAT=%R
    time ./test_ipfs.sh > /dev/null
done
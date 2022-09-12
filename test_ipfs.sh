#!/bin/bash

# create a random folder name under /tmp
TMPDIR=$(mktemp -d /tmp/ipfstest.XXXXXX)

echo "creating a random folder under /tmp: $TMPDIR"

for i in {1..5}
do
    # create a random file under the random folder
    TMPFILE1=$(mktemp $TMPDIR/testfileXXXXXX)

    # write random characters to the file without generating an illegal byte sequence
    dd if=/dev/urandom of=$TMPFILE1 bs=10 count=1000 2>/dev/null
done

echo "adding the random folder to ipfs"
# upload the folder to ipfs using " ./dist/pollinate-cli.js --send --path [folder] --once" and save the hash from stdout
HASH=$(./dist/pollinate-cli.js --send --path $TMPDIR --once)

echo "got hash:" $HASH

echo "downloading the folder from ipfs"

# download the folder form ipfs using ./dist/getcid-cli.js [hash] and print the results
node ./dist/getcid-cli.js $HASH > /dev/null

# remove the random folder
rm -rf $TMPDIR
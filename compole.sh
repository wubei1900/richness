#!/bin/bash

echo "-------------- begin --------------"

createDir() {
    if [ ! -d $1 ];then
        mkdir $1
    else
        rm -rf $1
        mkdir $1
    fi
}

createDir "dist"
cp -rf icons dist

createDir "release"
yarn run dll

yarn run build

echo "-------------- end --------------"


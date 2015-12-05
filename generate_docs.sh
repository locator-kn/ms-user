#!/bin/sh

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ $current_branch != 'master' ];
then
    return
fi
npm run documentation
git checkout gh-pages
git add .
git commit -m 'generate documentation'
git push origin gh-pages
git checkout master

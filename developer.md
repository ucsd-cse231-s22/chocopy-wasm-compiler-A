# Develop Convention

Here are some developer convention for us

- Use [informative commit messages](https://www.conventionalcommits.org/en/v1.0.0/)

- There can be multiple commits locally. However when pushing to the remote, plz rebaes it to one commit per change.
  Example:

  ```bash
  git commit -m "This is commit 1"
  git commit -m "This is commit 2"
  # Please rebase to one commit
  git rebase -i HEAD~2
  # Write commit message and merge conflict here
  git push
  ```

- CI / CD: I've already put a hook on our github. When we run ```git push``` we'll automatically run ```npm run test``` first and if there's any error we'll stop the push.

- From the last one, we'll have to maintain the tests well to prevent bad codes merged. Please add enough new tests to the existings when adding new feat.

- Review new changes periodicly

#Updating Active-Win

1. Clone the repo: [https://github.com/rize-io/active-win]
2. `cd` into the repo
3. Add the sindresorhus remote `git remote add sindresorhus https://github.com/sindresorhus/active-win.git`
4. If you run `git remote -v` you should be able to see both origin and sindresorhus remotes.
5. Checkout the `sindresorhus-main` branch. This branch is an exact copy of the original repo.
6. Run `git pull --rebase sindresorhus main` . This pulls in any recent changes from the original repo to make sure our fork stays in sync with it. Note, this is saying access the `sindresorhus` user’s repo of active win and rebase the `main` branch with Rize’s `sindresorhus-main` branch.
7. There shouldn’t be any conflicts since it’s an exact copy.
8. `cd` into the `main` branch. Now we want to rebase our main branch with the copy. `git rebase -i sindresorhus-main`
9. You’ll run into conflicts during this process, most likely just around version numbers, just accept the original version numbers and discard any `beta` version number changes.
10. Now `main` should be up to date with the latest changes from the original repo.
11. Add your changes
12. Run `npm run build` after your changes are complete.
13. `cd` into the repo directory, run `npm link`. This sets up this local instance of @rize-io/active-win to be available for linking.
14. `cd` into `sol/electron` then run `npm link @rize-io/active-win` to reference the local copy.
16. Verify your changes (go back to step 11 if necessary).
17. `cd` back into active-win and commit your changes.
18. Change the version number in the package file by appending `-beta.0` to the version. Add a separate commit.
19.  and force push `main`. If you are unsure you did it correctly, open a branch and create a PR so I can see.
20. Once `main` is updated, publish the npm package `npm publish`
21. Update the version number in `sol/electron`

# jasmin-manage-ui

![CI](https://github.com/cedadev/jasmin-manage-ui/actions/workflows/ci.yml/badge.svg)

[React](https://reactjs.org/) user interface for the JASMIN Projects Portal,
which consumes the [JASMIN Manage API](https://github.com/cedadev/jasmin-manage).

## Setting up a development environment

First, make sure you have a local version of the
[JASMIN Manage API](https://github.com/cedadev/jasmin-manage)
running on `http://localhost:8000`, as per the instructions in the `README`.

To install and run this user interface, first you will need [Node](https://nodejs.dev/) and
[yarn](https://yarnpkg.com/) installed.

Then check out the code:

```sh
git clone https://github.com/cedadev/jasmin-manage-ui.git
cd jasmin-manage-ui
```

Install the dependencies using `yarn`:

```sh
yarn install 
```

Then start the development server:

```sh
yarn start
```

This will start the JASMIN Projects Portal UI at `http://localhost:3000`.


If you have issues installing the version of yarn in all places might need updating:
```
yarn set version latest
yarn upgrade-interactive  
```
maybe the above in the dependancies on github and push to github, because yarn probably needs to be the same/close in all places

And maybe
```
rm -rf node_modules 
rm yarn.lock 
```

To run tests locally, use:
```sh
yarn test
```

To check the coverage of the tests locally, use:
```sh
yarn test --coverage
```
and this will tell you the % covered and which lines are uncovered.
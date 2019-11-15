# 2019-11-15 Meeting Notes

## RUNSPEC

Runspec will be the OCap-friendly, ESM friendly, Async friendly test framework.

**Need to know the four types of Javascript equality.**

Possible philosophy?  `test(() => ...)` always returns `...`, just logs whether it succeeded or failed with the description.

In `something.spec.js`:

```js
import something from './something.js';

export const testModdir = async ({test, deepEquals, console}) => {
  // # lib/subdir/something.spec.js#testModdir
  test.group(`it does the right thing`); // # it does the right thing
  const a = someOperation();
  test(() => a !== 123);
  const expectedA = [123, {b: 456}];
  test(() => deepEquals(a, expectedA));
  await test(() => Promise.resolve(true));

  test.group(`it doesn't fail`);
};

export const testOtherSomething = async ({test}) => {

};
```

```sh
npm t ... # runspec ...
runspec # everywhere (except node_modules)!
runspec lib # run lib/**/*.spec.js
runspec something.spec.js # specify in or under current folder
runspec something.spec.js#testModdir
```

## TypeDB Client for Node.js: Behaviour Tests

To develop the tests, simply run:
```
tsc
```
- If you don't have `tsc` available globally, install it using `npm install -g typescript`.

Running `tsc` will create the `dist` directory on your local machine, where all the BDD step implementations import typedb-client symbols from. This allows your IDE to provide IntelliSense.

> NOTE: When importing symbols in the test files, you must import everything from the 'dist' directory, or the tests will fail at runtime. This is because the Bazel test script compiles the client's source files and puts them in a folder called 'dist'.

The tests are all invoked via Bazel test targets, as in Client Java.

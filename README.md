# ms-sample

This repository contains some sample code for a single microservice.

It uses `seneca.js` and `rabbitmq`.

The business-logic lives in the `lib` directory. The `index.js` is used to expose the functionality.

## Tests

The repo contains also some tests with a sample to mock the database.

To run the tests, simple call `npm run test`.

## Documentation

The documentation can be found on the branch `gh-pages`. To update/generate the docs, call `npm run gendocs`
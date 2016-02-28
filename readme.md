# Utilio

## Requirements

### node.js

  * __Version__: 5
  * __Website__: https://nodejs.org/
  * __Download__: https://nodejs.org/download/
  * __Installation guide__: https://github.com/joyent/node/wiki/Installation

### MongoDB

  * __Version__: 3
  * __Website__: https://www.mongodb.org/
  * __Download__: https://www.mongodb.org/downloads
  * __Installation guide__: https://docs.mongodb.org/manual/installation/

## Installation

Clone the repository:

```
git clone git://github.com/morkai/walkner-utilio.git
```

or [download](https://github.com/morkai/walkner-utilio/zipball/master)
and extract it.

Go to the project's directory and install the dependencies:

```
cd walkner-utilio/
npm install -g grunt-cli
npm install
```

## Configuration

1. Create your own config directory (e.g. `walkner-utilio/config/development/`).
2. Create a JS file for each server process (`utilio-*.js` files) you want to run.
3. In each `walkner-utilio/config/development/utilio-*.js` file require and export the corresponding file from
   the `walkner-utilio/config/` directory.
4. Override whatever you want in your custom config files.

## Starting

```
node backend/main.js <path to the server process config>
```

For example:

```
cd walkner-utilio
node backend/main.js ../config/utilio-frontend.js
```

## License

This project is released under the [CC BY-NC-SA 4.0](https://raw.github.com/morkai/walkner-utilio/master/license.md).

Copyright (c) 2016, Łukasz Walukiewicz (lukasz@miracle.systems)

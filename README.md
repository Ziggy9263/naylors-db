# [![Naylor's Farm and Ranch Supply Online Order API](https://imgur.com/OPZoYue.png)](https://github.com/ziggy9263/naylors-db)

## Overview

This is an API for an online order system, written in Node.js with Express and Mongoose.

Based off of [Kunalkapadia's Express+Mongoose+EM6 Boilerplate REST API](https://github.com/kunalkapadia/express-mongoose-es6-rest-api/)

## Getting Started

Clone the repo:
```sh
git clone git@github.com:ziggy9263/naylors-db.git
cd naylors-db
```

Install yarn:
```js
npm install -g yarn
```

Install dependencies:
```sh
yarn
```

Set environment (vars):
```sh
cp .env.example .env
```

Start server:
```sh
# Start server
yarn start

# Selectively set DEBUG env var to get logs
DEBUG=naylors-db:* yarn start

# OR set DEBUG var in yarn command
yarn start:debug
```
Refer [debug](https://www.npmjs.com/package/debug) to know how to selectively turn on logs.

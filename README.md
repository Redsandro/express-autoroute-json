# jsonapi-server-mini

Super easy Node.js + MongoDB CRUD backend for JSON:API consuming apps like Ember.

`jsonapi-server-mini` allows you to quickly write an [ExpressJS](https://expressjs.com/) [JSON:API](https://jsonapi.org) server. Adhering to [_Convention Over Configuration_](https://en.wikipedia.org/wiki/Convention_over_configuration), your endpoints should have zero boilerplate code, and only contain your business logic.

## Scope

This module attempts to be a simplistic lightweight yet complete JSON:API endpoint. There should be out-of-the-box support for all basic JSON:API features you need to write a decent app, like `sort`, `filter`, `page` and `include`. Routes are limited to one type, one model, one schema. If you want something crazy, like a custom type that uses six models and a hard-coded joke about Belgians, you should look for a more advanced solution, such as the ones listed below:

* [Fortune.js](http://fortune.js.org/) with [fortune-json-api](https://github.com/fortunejs/fortune-json-api)
* [jsonapi-server](https://github.com/holidayextras/jsonapi-server) (no longer maintained)
* [express-autoroute](https://github.com/stonecircle/express-autoroute/) with [express-autoroute-json](https://github.com/stonecircle/express-autoroute-json/)

This project was forked from `express-autoroute-json` because its wide scope made it hard to land pull requests. `jsonapi-server-mini` is [KISS](https://en.wikipedia.org/wiki/KISS_principle), so we can implement the full JSON:API [base spec](https://jsonapi.org/format/) without taking complexities into account.

## Quick-start

```bash
npm install --save jsonapi-server-mini
```

### Super easy quick start

The module contains everything to get up and running. Even test routes `/tests` and `/users`. Don't worry, they will go away once you've defined your own models. But for now, check this out!

> __Note:__ For this super easy quick start, an authless mongo database is expected to run at port `27017`. You can run one for testing purposes using `docker`:
>
> ```bash
> docker run -d -p 27017:27017 --rm --name jsonapi-server-mini-mongo mongo
> ```

```bash
mkdir jsonapi-server-mini && cd $_
npm init -y
npm install --save jsonapi-server-mini
echo "require('jsonapi-server-mini')()" > index.js
node .
```

Bam! We're running a server. Let's create a user

```bash
curl -X POST http://localhost:8888/api/users \
    -H 'Content-Type: application/vnd.api+json' \
    -d @- <<'EOF'
{
  "data": {
    "type": "users",
    "attributes": {
      "name": "Some User",
      "email": "test@example.com"
    }
  }
}
EOF
```

OMG! Is this real? Can we fetch the user?

```bash
wget http://localhost:8888/api/users | jq
```

Response:
```javascript
{
  "data": [
    {
      "type": "users",
      "id": "5c1d81d48a162b5776ab7fd0",
      "attributes": {
        "name": "Some User",
        "email": "test@example.com"
      }
    }
  ]
}
```

## Route definitions

The above `/api/users` example route is active because you haven't defined your own resources. The fallback from `node_modules/jsonapi-server-mini/routes/api/user.js` is loaded:

```js
module.exports = ({mongoose}) => ({
    schema      : new mongoose.Schema({
        name        : String,
        email       : String
    }),

    // CRUD operations. Remove to disable.
    find        : {},
    create      : {},
    update      : {},
    delete      : {}
})
```

### Our first app

You should create your own routes in your app's `routes` directory. You'll need to specify the full path to your own `routes` directory. Now let's create our first fully working app:

`index.js`:
```js
const path      = require('path')
const jsMini    = require('jsonapi-server-mini')

jsMini({
    routes: path.join(__dirname, 'routes')
})
```

Any sub-directory will be appended to the route in case you want `/api/v1`, `/api/v2` etc. The filename (in singular form) decides the resource type and schema name (in plural form). Go ahead and copy the file, adding something crazy to the schema!

### Module options

When starting **jsonapi-server-mini**, we can provide an `options` _Object_ like so: `jsMini(options)`. Every option is, well, optional. But it makes sense to at least define your own routes, and specify the path to them using `routes`.

* `app` _Router_ Express router
* `authn` _function_ Basic first-line authentication
* `limit` _Number_ Global limit for `find` queries. **Default:** `50`
* `limitMax` _Number_ Maximum query string limit override. **Default:** `100`
* `logger` _Module_ **Default:** `winston` console logger
* `meta` _Object_ Static metadata to append to every JSON:API response. E.g. server version information.
* `mongoose` _Module_ in case you want to re-use an existing instance.
* `mongoUri` _String_ MongoDB connection string
* `routes` _String_ Path to custom routes

#### `app`

If you want to use your own _Express Router_ so you can add different (non-JSON:API) endpoints to your app, you can do so, but you'll need to enable some basic parsing for `jsonapi-server-mini` to work on requests:

* Handle CORS
* Decode `urlencoded` requests
* Parse body for `application/vnd.api+json` mimetype

Here is an example:

`index.js`:
```js
const path      = require('path')
const express   = require('express')
const bodyParser= require('body-parser')
const morgan    = require('morgan')
const cors      = require('cors')
const jsMini    = require('jsonapi-server-mini')

const app       = new express.Router()
const routes    = path.join(__dirname, 'routes')

app.use(cors())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json({ type: 'application/vnd.api+json' }))

express()
    .use(morgan('combined'))
    .use('/jsonapi', app) // jsonapi-server-mini endpoint
    .get('/', (req, res) => res.json({ hello: 'world' })) // custom endpoint
    .listen(4488)

jsMini({ app, routes })
```

#### `authn`

* `authn` _function(req, res, next) -> Callback_

#### `mongoUri`

If you are not running an authless MongoDB server on localhost, you need to provide a MongoDB connection string. E.g.:

```js
jsMini({
    mongoUri: 'mongodb://user:password@hostname/database'
})
```

### Route options

* `schema` _Schema_ A Mongoose Schema
* `description` _To do_
* `indexes` _Object or Array_ Define one or more indexes

#### Indexes

You can define a single compound index that cannot be defined in the schema itself.

```js
module.exports = ({mongoose}) => ({
    schema  : new mongoose.Schema({
        name    : String,
        group   : { type: String, required: true },
        friends : [ { type: String, required: true } ]
    }),

    indexes : {
        group   : 1,
        friends : 1
    },

    // CRUD operations. Remove to disable.
    find    : {}
})
```

Or multiple compound indexes.

```js
    indexes : [
        {
            group   : 1,
            friends : 1
        },
        {
            group   : 1,
            name    : 1
        }
    ]
```

> __Note:__ Although this is useful for development, it's recommended to define indexes manually, so that your application restarts faster.

### CRUD method options

* `authn` _function(req, res, next) -> Callback_ _To do_
* `authz` _function(req) -> Object_ _To do_
* `find.query` _To do_

### Schema

For defining your schema, take a look at the [Mongoose Schema](https://mongoosejs.com/docs/guide.html) documentation. Try not to make it too complex; it needs to map to JSON:API. Basically, everything is an `attribute`. To define a `relationship`, first create a route for the type of the relationship, e.g. `test.js`. Next, specify a property with its `type` set to `ObjectID` and its [`ref`](https://mongoosejs.com/docs/api.html#schematype_SchemaType-ref) to the (capitalized) (file)name of the new resource you just created:

```js
module.exports = ({mongoose}) => ({
    schema    : new mongoose.Schema({
        name    : String,
        email    : String,

        // One-to-many relationship
        myTests    : [{
            type    : mongoose.Schema.Types.ObjectId,
            ref        : 'Test'
        }],

        // One-to-one relationship
        lastUsed    : {
            type    : mongoose.Schema.Types.ObjectId,
            ref        : 'Test'
        }
    }),

    // CRUD operations. Remove to disable.
    find    : {}
})
```

### CRUD operations

The comment says it all. You can remove them to disable them, or add route-specific options.

### Authentication

Once you've written some custom authentication logic, you can create an _Express Middleware_ function `authn` to either continue or throw an error. The same authentication applies to all CRUD methods.

```js
module.exports = ({mongoose}) => ({
    schema,

    authn(req, res, next) {
        // Allow access for user
        if (req.user) return next()

        // Deny access for everyone else
        next(new Error("You are not logged in"))
    },

    // CRUD operations. Remove to disable.
    find    : {}
})
```

Let's make it a bit more complex. What if you want to be publicly readable, but only writable for a user, and only deletable by an admin? Simply move the method-specific `auth` function to the method object:

```js
function authn(req, res, next) {
    // Allow access for user
    if (res.locals.user) return next()

    // Deny access for everyone else
    next(new Error("You are not logged in"))
}

module.exports = ({mongoose}) => ({
    schema,

    // CRUD operations. Remove to disable.
    find    : {},
    create  : {
        authn
    },
    update  : {
        authn
    },
    delete  : {
        authn(req, res, next) {
            // Allow access for admin
            if (res.locals.user && res.locals.isAdmin) return next()

            // Deny access for everyone else
            next(new Error("You do not have administrator privileges"))
        }
    }
})
```

You may have a global `authn` function in your `jsMini` defenition, but are looking to pass an otherwise rejected authentication. To do this, you can use an upstream `authn` function to set a variable that you will check downstream.

`someRoute.js`:
```js
module.exports = ({mongoose}) => ({
    description    : 'This route will override global authn',
    schema,

    authn(req, res, next) {
        res.locals.authenticated = true

        return next()
    },

    find,
```

`index.js`:
```js
const jsMini = require('jsonapi-server-mini')

function authn() {
    if (res.locals.authenticated === true) return next() // Granted elsewhere
}

jsMini({ authn })
```

### Authorization

Even when your user is authenticated, they are probably not supposed to access data from another user. Authorization allows for more granular control. Add the `authz` function to the specific CRUD, route, or global configuration you would like to apply rules to.

You can either add full express middleware:

```javascript
function authz(req, res, next) {
    const { query } = req.jsMini
    const isAdmin = res.locals.role == 'admin'
    const adminOnly = {$ne: true}

    if (isAdmin)
        req.jsMini.query = {...query, adminOnly}

    next()
}
```

A shortcut function with one argument, returning a mandatory query selector:


```javascript
function authz(req) {
    const { userId } = req.res.locals

    return {
        userId
    }
}
```

Or a shortcut function simply returning a boolean indicating access granted or denied:

```javascript
function authz(req) {
    return ['subscriber', 'editor'].includes(res.locals.role)
}
```

#### Example

```javascript
function authn(req, res, next) {
    // Allow access for user
    if (res.locals.user) return next()

    // Deny access for everyone else
    next(new Error("You are not logged in"))
}

function authz(req) {
    const { userId } = req.res.locals

    // Assuming user created resources have the users' userId attribute
    return {
        userId
    }
}

module.exports = ({mongoose}) => ({
    schema,

    // Everyone can find
    find    : {},

    // All users can create
    create  : {
        authn
    },

    // Only owners can update or delete
    update  : {
        authn,
        authz
    },
    delete  : {
        authn,
        authz
    }
})
```

## JSON:API support

The current implementation attempts to follow the basics of the [JSON:API 1.0 spec](https://jsonapi.org/format/).

### Sort

Allow sorting using a preconfigured `sort` _Object_ on the route configuration, or a `sort` _String_ in your query.

```
?sort=-date
```

### Filter

Filter (or 'query') results with a `filter` _String_ in your query.

```
?filter[type]=order&filter[quantity]=<10
```

There are a couple of filter operators for making advanced queries:

- `<=` like MongoDB's `$lte`
- `>=` like MongoDB's `$gte`
- `<` like MongoDB's `$lt`
- `>` like MongoDB's `$gt`
- `:` partial match (case insensitive)
- `~` exact match (case insensitive)
- `:~` ends with (case insensitive)
- `~:` starts with (case insensitive)
- `!` is like MongoDB's `$ne`

### Fields

Choose what fields to select from documents. You can either predefine this in your route, or instruct the jsonapi server with your querystring.

#### Fields preconfigured in route

Add a `field` object to your route, with keys being the fieldnames you want to include (`1`) or exclude (`0`). You can only include or exclude all fields. Not a mix of both.

```js
module.exports = ({mongoose}) => ({
    // ...

    fields  : {
        bio         : 0,
        friends     : 0
    },
```

#### Fields instructed in querystring

Submit a comma separated value with the name of fields you want to include. _or_ a list of names you want to exclude prepended by a minus symbol.

```
GET api/users?fields=-bio,-friends
```

### Include

At the moment, includes work one level deep.

### Advanced

#### Middleware

Perhaps you're trying to do something slightly more complicated, but you are not ready for [Fortune.js](http://fortune.js.org/) yet. You might benefit from using a custom middleware function right before your query is executed. You can specify this function on multiple levels. The CRUD level, the route level, and the global level (when initializing `jsMini`).

```js
module.exports = ({mongoose}) => ({
    // ...

    middleware(req, res, next) {
        // Executed before _every_ crud operation on this route
        return next()
    },

    find    : {
        middleware(req, res, next) {
            // Executed before every _find_ operation on this route
            return next()
```

#### Shortcut middleware

Often you'll just want to pre-fill the query (i.e. `req.jsMini.query`) with a non-async object-returning function, similar to `authz`. You can suffice with a single `req` parameter:

```js
    middleware(req) {
        return {
            customFilter: 'presetValue'
        }
    },
```

#### Other middleware

You can turn middleware into an object with multiple hooks. `pre(req)` is the same as `middleware(req)`. With this notation, you can add advanced middleware:

```js
    middleware {
        pre(req, res, next) { /* ... */ },
        beforeSerializer(data) { /* ... */ },   // findOne or findMany
        afterSerializer(json) { /* ... */ },
    },
```

# Contributing

We like to keep the scope of this module very small and easy to maintain in order to allow for quickly building small yet decent apps. Any pull request that adds complexity not part of the JSON:API spec will be rejected.

## Running tests

Stop anything running on port `27017`, and start an authless mongo database using `docker`:

```bash
npm run start-docker
```

Install dependencies:

```bash
npm install
```

Run mocha:

```bash
npm run test-mocha
```


# Licence

Copyright (c) 2018 - 2019, Redsandro Media <info@redsandro.com>

Copyright (c) 2014 - 2018, Stone Circle <info@stonecircle.ie>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

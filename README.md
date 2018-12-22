# jsonapi-server-mini

Super easy node/mongo CRUD backend for JSON:API consuming apps like Ember.

`jsonapi-server-mini` allows you to quickly write an [ExpressJS](https://expressjs.com/) [JSON:API](https://jsonapi.org) server. Adhering to [_Convention Over Configuration_](https://en.wikipedia.org/wiki/Convention_over_configuration). Your endpoints should have zero boilerplate code, and only contain your business logic.

This module attempts to be as simple as possible, yet still be fully compliant with JSON:API. That means we should be able to do things like `sort`, `filter`, `page`, `include`, pretty much everything you need to write a descent app.

On the other hand, there won't be any custom complexity. One route means one type, one model, one schema. If you want something crazy, like a custom type that uses six models and a hard-coded joke about Belgians, you should look for a heavier solution, such as the ones listed below:

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
echo "require('../')()" > index.js
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

The above `/api/users` example works because you haven't defined your own resources. The fallback from `node_modules/jsonapi-server-mini/routes/api/user.js` is loaded:

```js
module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		email	: String
	}),

	// CRUD operations. Remove to disable.
	find	: {},
	create	: {},
	update	: {},
	delete	: {}
})
```

You should create your own routes in your app's `routes` directory. You'll need to specify the full path to your own `routes` directory.

`index.js`:
```js
const path = require('path')
const jserve = require('jsonapi-server-mini')

jserve({
	routes: path.join(__dirname, 'routes')
})
```

Any sub-directory will be appended to the route in case you want `/api/v1`, `/api/v2` etc. The filename (in singular form) decides the resource type and schema name (in plural form). Go ahead and copy the file, adding something crazy to the schema!

### Schema

For defining your schema, take a look at the [Mongoose Schema](https://mongoosejs.com/docs/guide.html) documentation. Try not to make it too complex; it needs to map to JSON:API. Basically, everything is an `attribute`. To define a `relationship`, first create a route for the type of the relationship, e.g. `test.js`. Next, specify a property with its `type` set to `ObjectID` and its [`ref`](https://mongoosejs.com/docs/api.html#schematype_SchemaType-ref) to the (capitalized) (file)name of the new resource you just created:

```js
module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		email	: String,

		// One-to-many relationship
		myTests	: [{
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}],

		// One-to-one relationship
		lastUsed	: {
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}
	}),

	// CRUD operations. Remove to disable.
	find	: {}
})
```

### CRUD operations

The comment says it all. You can remove them to disable them, or add route-specific options.

### Authentication

Once you've written some custom authentication logic, you can create an _Express Middleware_ function `auth` to either continue or throw an error. The same authentication applies to all CRUD methods.

```js
module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		email	: String,

		// One-to-many relationship
		myTests	: [{
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}],

		// One-to-one relationship
		lastUsed	: {
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}
	}),

	auth(req, res, next) {
		// Allow access for user
	    if (req.user) return next()

		// Deny access for everyone else
	    next(new Error("You are not logged in"))
	},

	// CRUD operations. Remove to disable.
	find	: {}
})
```

Let's make it a bit more complex. What if you want to be publicly readable, but only writable for a user, and only deletable by an admin? Simply move the method-specific `auth` function to the method object:

```js
function auth(req, res, next) {
	// Allow access for user
	if (req.user) return next()

	// Deny access for everyone else
	next(new Error("You are not logged in"))
}

module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		email	: String,

		// One-to-many relationship
		myTests	: [{
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}],

		// One-to-one relationship
		lastUsed	: {
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}
	}),

	// CRUD operations. Remove to disable.
	find	: {},
	create	: {
		auth
	},
	update	: {
		auth
	},
	delete	: {
		auth(req, res, next) {
			// Allow access for admin
			if (req.user && req.user.isAdmin) return next()

			// Deny access for everyone else
			next(new Error("You do not have administrator privileges"))
		}
	}
})
```

### Select

_To do_

## JSON:API support

_To do_

### Sort

_To do_

### Filter

_To do_

### Fields

_To do_

### Include

At the moment, includes work one level deep.

# Licence

Copyright (c) 2018 - 2019, Redsandro Media <info@redsandro.com>
Copyright (c) 2018, Stone Circle <info@stonecircle.ie>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

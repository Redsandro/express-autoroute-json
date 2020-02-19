/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const { Error:JsonApiError } = require('jsonapi-serializer')
const create 		= require('./pipeline/create')
const findOne		= require('./pipeline/findOne')
const findMany		= require('./pipeline/findMany')
const fields 		= require('./pipeline/fields')
const sort			= require('./pipeline/sort')
const deleteOne		= require('./pipeline/deleteOne')
const error			= require('./pipeline/error')
const updateOne		= require('./pipeline/updateOne')

module.exports = (options) => {
	const type			= get(options, 'model.collection.name')
	const routeMap		= {}

	if (!type) throw new Error('Mongoose model is missing')

	if (options.create) {
		routeMap.post = {
			[`/${type}`]: [
				auth(options, 'create'),
				middlewrap(options, 'create', create),
				error(options),
			].filter(Boolean)
		}
	}

	if (options.find) {
		routeMap.get = {
			[`/${type}`]: [
				auth(options, 'find'),
				fields(options),
				sort(options),
				middlewrap(options, 'find', findMany),
				error(options),
			].filter(Boolean),

			[`/${type}/:id`]: [
				auth(options, 'find'),
				fields(options),
				middlewrap(options, 'find', findOne),
				error(options),
			].filter(Boolean)
		}
	}

	if (options.update) {
		routeMap.patch = {
			[`/${type}/:id`]: [
				auth(options, 'update'),
				middlewrap(options, 'update', updateOne),
				error(options),
			].filter(Boolean)
		}
	}

	if (options.delete) {
		routeMap.delete = {
			[`/${type}/:id`]: [
				auth(options, 'delete'),
				middlewrap(options, 'delete', deleteOne),
				error(options),
			].filter(Boolean)
		}
	}

	return routeMap
}

/**
 * Execute all authn and authz functions.
 * @param  {Object} options Route options
 * @param  {String} method    The CRUD method to use
 * @return {Function[]}     Array of auth functions to use
 */
function auth(options, method) {
	return [
		(req, res, next) => (
			// Create namespaces
			req.jsMini = { query: {}, select: {} }
		) && next(),
		middlefy(options, `${method}.authn`),									// Method-specific authn
		middlefy(options, 'authn'),												// Route-specific authn
		middlefy(options, 'args.authn'),										// Global authn
		middlefy(options, 'args.authz'),										// Global authz
		middlefy(options, 'authz'),												// Route authz
		middlefy(options, `${method}.authz`),									// Method authz
	].filter(Boolean)
}

/**
 * Wrap CRUD-function in pre- and postmiddleware
 * @param  {Object} options Route options
 * @param  {String} method    The CRUD method to use
 * @param  {Function} fn    CRUD method function
 * @return {Function[]}     Array with middleware functions
 */
function middlewrap(options, method, fn) {
	return [
		middleware(options, method, 'pre'),
		fn(options),
		// middleware(options, method, 'post'), // see beforeSerializer
	]
}

/**
 * Return all middleware functions.
 * You can now use middleware() or middleware{pre(), post()} in your route or global options.
 * @param  {Object} options Route options
 * @param  {String} method    The CRUD method to use
 * @param  {String='pre','post'} order Is this pre or post middleware
 * @return {Function[]}     Array of auth functions to use
 */
function middleware(options, method) {
	return [
		middlefy(options, 'args.middleware'),
		middlefy(options, 'args.middleware.pre'),
		middlefy(options, 'middleware'),
		middlefy(options, 'middleware.pre'),
		middlefy(options, `${method}.middleware`),
		middlefy(options, `${method}.middleware.pre`),
	].filter(Boolean)
}

/**
 * Middleware-ify - Return middleware function if only one argument was passed.
 * Normally you use e.g. `authz` with one argument (`req`) and return a query object.
 * But this will allow you to insert complete middleware if you so wish, for example if you wish to `await` something
 * before calling `next()`, or throw custom errors. In this case you need to add the `req.jsMini.query` object manually,
 * which will be merged with the mongoose query.
 * @example
 * ```js
 * // Assuming user.id is defined by your authentication function:
 * authn: (req) => ({ author: req.user.id })
 * ```
 * @example
 * ```js
 * // Assuming `options.getUser()` is a user returning function:
 * async authn(req, res, next) {
 * 	const user = await options.getUser()
 * 	if (!user) return next(new Error('User not found!!1'))
 * 	req.jsMini.query = { author: user.id }
 * 	return next()
 * }
 * ```
 * @param  {Object} options Route options
 * @param  {String} path    Property to fetch from `options`
 * @return {function}       Middleware function
 */
function middlefy(options, path) {
	const fn = get(options, path, null)

	if (typeof fn == 'function') {
		switch (fn.length) {
			case 3:
				return fn
			case 1:
				return (req, res, next) => {
					const { query }	= req.jsMini
					const result	= fn(req)

					// If authz returns a boolean, it means access granted|denied
					if (typeof result == 'boolean') {
						if (!result)
							return res.status(401).json(new JsonApiError({title: 'User not found.'}))

						return next()
					}

					// If fn returns an object, add it to the query.
					req.jsMini.query = {...query, ...result}
					return next()
				}
		}
	}

	return null
}

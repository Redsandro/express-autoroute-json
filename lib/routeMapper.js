/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
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
 * @param  {String} crud    The CRUD method to use
 * @return {Function[]}     Array of auth functions to use
 */
function auth(options, crud) {
	return [
		(req, res, next) => (
			// Create namespaces
			req.jsMini = { query: {}, select: {} }
		) && next(),
		get(options, `${crud}.authn`),											// Method-specific authn
		get(options, 'authn'),													// Route-specific authn
		get(options, 'args.authn'),												// Global authn
		middlefy(options, 'args.authz'),										// Global authz
		middlefy(options, 'authz'),												// Route authz
		middlefy(options, `${crud}.authz`),										// Method authz
	].filter(Boolean)
}

/**
 * Wrap CRUD-function in pre- and postmiddleware
 * @param  {Object} options Route options
 * @param  {String} crud    The CRUD method to use
 * @param  {Function} fn    CRUD method function
 * @return {Function[]}     Array with middleware functions
 */
function middlewrap(options, crud, fn) {
	return [
		middleware(options, crud, 'pre'),
		fn(options),
		middleware(options, crud, 'post'),
	]
}

/**
 * Return all middleware functions.
 * You can now use middleware() or middleware{pre(), post()} in your route or global options.
 * @param  {Object} options Route options
 * @param  {String} crud    The CRUD method to use
 * @param  {String='pre','post'} order Is this pre or post middleware
 * @return {Function[]}     Array of auth functions to use
 */
function middleware(options, crud, order) {
	const pre = order === 'pre'

	return [
		pre && middlefy(options, 'args.middleware'),
		middlefy(options, `args.middleware.${order}`),
		pre && middlefy(options, 'middleware'),
		middlefy(options, `middleware.${order}`),
		pre && middlefy(options, `${crud}.middleware`),
		middlefy(options, `${crud}.middleware.${order}`),
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
 * authorisation: (req) => ({ author: req.user.id })
 * ```
 * @example
 * ```js
 * // Assuming `options.getUser()` is a user returning function:
 * async authorisation(req, res, next) {
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
					req.jsMini.query = fn(req)
					return next()
				}
		}
	}

	return null
}

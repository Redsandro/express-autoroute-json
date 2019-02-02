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
				create(options),
				error(options),
			].filter(Boolean)
		}
	}

	if (options.find) {
		routeMap.get = {
			[`/${type}`]: [
				auth(options, 'find'),
				sort(options),
				fields(options),
				findMany(options),
				error(options),
			].filter(Boolean),

			[`/${type}/:id`]: [
				auth(options, 'find'),
				fields(options),
				findOne(options),
				error(options),
			].filter(Boolean)
		}
	}

	if (options.update) {
		routeMap.patch = {
			[`/${type}/:id`]: [
				auth(options, 'update'),
				updateOne(options),
				error(options),
			].filter(Boolean)
		}
	}

	if (options.delete) {
		routeMap.delete = {
			[`/${type}/:id`]: [
				auth(options, 'delete'),
				deleteOne(options),
				error(options),
			].filter(Boolean)
		}
	}

	return routeMap
}

/**
 * Return dedicated auth function if specified.
 * Execute ONLY the crud specific auth function if it exists, otherwise
 * use the global auth function, if it exists.
 * @param  {Object} options Route options
 * @param  {String} crud    The CRUD method to use
 * @return {Function}       The auth function to use
 */
function auth(options, crud) {
	return [
		(req, res, next) => req.jsMini = {} && next(),
		get(options, 'args.authn'),
		get(options, 'authn'),
		get(options, `${crud}.authn`),
		middlefyAuthz(options, 'args.authz'),
		middlefyAuthz(options, 'authz'),
		middlefyAuthz(options, `${crud}.authz`),
	].filter(Boolean)
}

/**
 * Middleware-ify Authz - Return middleware function if only one argument was passed.
 * Normally you use `authz` with one argument (`req`) and return a query object.
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
 * @param  {[type]} options [description]
 * @param  {[type]} path    [description]
 * @return {[type]}         [description]
 */
function middlefyAuthz(options, path) {
	const fn = get(options, path, [])
	switch (fn.length) {
		case 3:
			return fn
		case 1:
			return (req, res, next) => {
				req.jsMini.query = fn(req)
				return next()
			}
		default:
			return null
	}
}

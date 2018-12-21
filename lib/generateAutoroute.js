/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const create 		= require('./create')
const deleteOne		= require('./deleteOne')
const error			= require('./error')
const findMany		= require('./findMany')
const findOne		= require('./findOne')
const queryFunction	= require('./query')
const selectFunction = require('./select')
const sortFunction	= require('./sort')
const updateOne		= require('./updateOne')

module.exports = function(options) {
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

				queryFunction(options),
				sortFunction(options),
				selectFunction(options),
				findMany(options),
				error(options),
			].filter(Boolean),

			[`/${type}/:id`]: [
				auth(options, 'find'),

				selectFunction(options),
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
	return get(options, `${crud}.authentication`, options.authentication)
}

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
	return get(options, `${crud}.authentication`, options.authentication)
}

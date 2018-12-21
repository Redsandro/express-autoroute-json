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
				get(options, 'create.authentication', options.authentication),
				create(options),
				error,
			].filter(Boolean)
		}
	}

	if (options.find) {
		routeMap.get = {
			[`/${type}`]: [
				get(options, 'find.authentication', options.authentication),

				queryFunction(options),
				sortFunction(options),
				selectFunction(options),
				findMany(options),
				error,
			].filter(Boolean),

			[`/${type}/:id`]: [
				get(options, 'find.authentication', options.authentication),

				selectFunction(options),
				findOne(options),
				error,
			].filter(Boolean)
		}
	}

	if (options.update) {
		routeMap.patch = {
			[`/${type}/:id`]: [
				get(options, 'update.authentication', options.authentication),

				updateOne(options),
				error,
			].filter(Boolean)
		}
	}

	if (options.delete) {
		routeMap.delete = {
			[`/${type}/:id`]: [
				get(options, 'delete.authentication', options.authentication),

				deleteOne(options),
			].filter(Boolean)
		}
	}

	return routeMap
}

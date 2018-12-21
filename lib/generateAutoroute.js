const createExecution = require('./createExecution')
const createFunction = require('./create')
const deleteOne		= require('./deleteOne')
const error			= require('./error')
const findMany		= require('./findMany')
const findOne		= require('./findOne')
const queryFunction	= require('./query')
const selectFunction = require('./select')
const sortFunction	= require('./sort')
const updateOne		= require('./updateOne')

module.exports = function(options) {
	// check required fields
	if (!options.model) {
		throw new Error('Mongoose model is missing')
	}

	// set the defaults
	const resource		= options.model.collection.name
	const routeMap		= {}

	// switch (Object.keys(options)) {
	// 	case 'find'
	// }

	if (options.find) {
		routeMap.get = {}
		routeMap.get[`/${resource}`] = [
			options.authentication,
			get(options, 'find.authentication'),

			options.preMiddleware,
			get(options, 'find.preMiddleware'),
			queryFunction(options),
			sortFunction(options),
			selectFunction(options),
			findMany(options),
			error,
		].filter(Boolean)

		routeMap.get[`/${resource}/:id`] = [
			// global then local authentication
			options.authentication,
			get(options, 'find.authentication'),

			options.preMiddleware,
			get(options, 'find.preMiddleware'),
			selectFunction(options),
			findOne(options),
			error,
		].filter(Boolean)
	}

	if (options.create) {
		routeMap.post = {}
		routeMap.post[`/${resource}`] = [
			options.authentication,
			get(options, 'create.authentication'),

			options.preMiddleware,
			get(options, 'create.preMiddleware'),
			createFunction(options),
			createExecution(options),
			get(options, 'create.postMiddleware'),
			error,
		].filter(Boolean)
	}

	if (options.update) {
		routeMap.patch = {}
		routeMap.patch[`/${resource}/:id`] = [
			options.authentication,
			get(options, 'update.authentication'),

			options.preMiddleware,
			get(options, 'update.preMiddleware'),
			updateOne(options),
			get(options, 'update.postMiddleware'),
			error,
		].filter(Boolean)
	}

	if (options.delete) {
		routeMap.delete = {}
		routeMap.delete[`/${resource}/:id`] = [
			options.authentication,
			get(options, 'delete.authentication'),

			options.preMiddleware,
			get(options, 'delete.preMiddleware'),
			deleteOne(options),
			get(options, 'delete.postMiddleware'),
		].filter(Boolean)
	}

	return routeMap
}

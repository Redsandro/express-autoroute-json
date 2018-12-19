const _				= require('lodash')

const authorizeFn	= require('./authorisation')
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

// function exposeSerializer(options) {
// 	return function(req, res, next) {
// 		req.serialize = function(data) {
// 			return serialize(data, options)
// 		}
// 		next()
// 	}
// }

module.exports = function(options) {
	// check required fields
	if (!options.model) {
		throw new Error('Mongoose model is missing')
	}

	// set the defaults
	const resource		= options.model.collection.name
	const outputJson	= {}

	if (options.find) {
		outputJson.get = {}
		outputJson.get[`/${resource}`] = [
			// exposeSerializer(options),
			options.authentication,
			get(options, 'find.authentication'),
			authorizeFn(options, 'find'),

			options.preMiddleware,
			get(options, 'find.preMiddleware'),
			queryFunction(options),
			sortFunction(options),
			selectFunction(options),
			findMany(options),
			error,
		].filter(Boolean)

		outputJson.get[`/${resource}/:id`] = [
			// exposeSerializer(options),
			// global then local authentication
			options.authentication,
			get(options, 'find.authentication'),
			authorizeFn(options, 'find'),

			options.preMiddleware,
			get(options, 'find.preMiddleware'),
			selectFunction(options),
			findOne(options),
			error,
		].filter(Boolean)
	}

	if (options.create) {
		outputJson.post = {}
		outputJson.post[`/${resource}`] = [
			// exposeSerializer(options),
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
		outputJson.patch = {}
		outputJson.patch[`/${resource}/:id`] = [
			// exposeSerializer(options),
			options.authentication,
			get(options, 'update.authentication'),
			authorizeFn(options, 'update'),

			options.preMiddleware,
			get(options, 'update.preMiddleware'),
			updateOne(options),
			get(options, 'update.postMiddleware'),
			error,
		].filter(Boolean)
	}

	if (options.delete) {
		outputJson.delete = {}
		outputJson.delete[`/${resource}/:id`] = [
			// exposeSerializer(options),
			options.authentication,
			get(options, 'delete.authentication'),
			authorizeFn(options, 'delete'),

			options.preMiddleware,
			get(options, 'delete.preMiddleware'),
			deleteOne(options),
			get(options, 'delete.postMiddleware'),
		].filter(Boolean)
	}

	return outputJson
}

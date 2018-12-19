const _				= require('lodash')

const authorizeFn	= require('./authorisation')
const createExecution = require('./createExecution')
const createFunction = require('./create')
const deleteOne		= require('./deleteOne')
const emptyMiddleware = require('./emptyMiddleware')
const error			= require('./error')
const findMany		= require('./findMany')
const findOne		= require('./findOne')
const identMiddleware = require('./identityMiddleware')
const queryFunction	= require('./query')
const selectFunction = require('./select')
const sortFunction	= require('./sort')
const updateOne		= require('./updateOne')
const serialize		= require('./serialise')

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
			options.authentication || identMiddleware,
			_.get(options, 'find.authentication', identMiddleware),
			authorizeFn(options, 'find'),

			options.preMiddleware || identMiddleware,
			_.get(options, 'find.preMiddleware', identMiddleware),
			queryFunction(options),
			sortFunction(options),
			selectFunction(options),
			findMany(options),
			error,
		]

		outputJson.get[`/${resource}/:id`] = [
			// exposeSerializer(options),
			// global then local authentication
			options.authentication || identMiddleware,
			_.get(options, 'find.authentication', identMiddleware),
			authorizeFn(options, 'find'),

			options.preMiddleware || identMiddleware,
			_.get(options, 'find.preMiddleware', identMiddleware),
			selectFunction(options),
			findOne(options),
			error,
		]
	}

	if (options.create) {
		outputJson.post = {}
		outputJson.post[`/${resource}`] = [
			// exposeSerializer(options),
			options.authentication || identMiddleware,
			_.get(options, 'create.authentication', identMiddleware),

			options.preMiddleware || identMiddleware,
			_.get(options, 'create.preMiddleware', identMiddleware),
			createFunction(options),
			createExecution(options),
			_.get(options, 'create.postMiddleware', emptyMiddleware),
			error,
		]
	}

	if (options.update) {
		outputJson.patch = {}
		outputJson.patch[`/${resource}/:id`] = [
			// exposeSerializer(options),
			options.authentication || identMiddleware,
			_.get(options, 'update.authentication', identMiddleware),
			authorizeFn(options, 'update'),

			options.preMiddleware || identMiddleware,
			_.get(options, 'update.preMiddleware', identMiddleware),
			updateOne(options),
			_.get(options, 'update.postMiddleware', emptyMiddleware),
			error,
		]
	}

	if (options.delete) {
		outputJson.delete = {}
		outputJson.delete[`/${resource}/:id`] = [
			// exposeSerializer(options),
			options.authentication || identMiddleware,
			_.get(options, 'delete.authentication', identMiddleware),
			authorizeFn(options, 'delete'),

			options.preMiddleware || identMiddleware,
			_.get(options, 'delete.preMiddleware', identMiddleware),
			deleteOne(options),
			_.get(options, 'delete.postMiddleware', emptyMiddleware),
		]
	}

	return outputJson
}

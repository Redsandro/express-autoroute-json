/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const camelcaseKeys = require('camelcase-keys')
const serializer	= require('./serialise')

module.exports = (options) => async(req, res, next) => {
	const dataType		= get(req, 'body.data.type')
	const modelType		= get(options, 'model.collection.name')
	const data			= parseProperties(get(req, 'body.data'), {})
	const model			= new options.model(data)

	if (dataType !== modelType) return next(new Error(`Wrong type. '${modelType}' expected. '${dataType}' given.`))

	try {
		const result		= await model.save()
		res.status(201).json(serializer(result, options))

		return next()
	}
	catch (err) {
		return next(err)
	}
}

/**
 * Convert JSON:API document to mongoose model data
 * @param  {Object} attributes    Submitted attributes
 * @param  {Object} relationships Submitted relationships
 * @return {Object}               Mongoose data
 */
function parseProperties(data) {
	const attributes	= camelcaseKeys(get(data, 'attributes', {}))
	const relationships	= camelcaseKeys(get(data, 'relationships', {}))

	return Object.keys(relationships).reduce((model, relationship) => {
		const value			= relationships[relationship]
		model[relationship] = Array.isArray(value.data)
			// One-to-many
			? value.data.map(rel => rel.id).filter(Boolean)
			// One-to-one
			: value.data.id
		return model
	}, attributes)
}

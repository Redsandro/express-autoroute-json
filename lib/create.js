/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const camelcaseKeys = require('camelcase-keys')
const serializer	= require('./serialise')

module.exports = (options) => async(req, res, next) => {
	const attributes	= camelcaseKeys(get(req, 'body.data.attributes', {}))
	const relationships	= camelcaseKeys(get(req, 'body.data.relationships', {}))
	const data			= Object.keys(relationships).reduce((model, relationship) => {
		const value			= relationships[relationship]
		model[relationship] = Array.isArray(value.data)
			? value.data.map(rel => rel.id).filter(Boolean)
			: value.data.id
		return model
	}, attributes)
	const model			= new options.model(data)

	try {
		const result = await model.save()
		res.status(201).json(serializer(result, options))
		return next()
	}
	catch (err) {
		return next(err)
	}
}

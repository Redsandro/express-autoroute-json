/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const _				= require('lodash')
const serialise		= require('./serializer')
const parseInclude	= require('./parseInclude')

module.exports = (options) => (req, res, next) => {
	const id			= options.translateId ? options.translateId(req.params.id, req) : req.params.id
	const relInclude	= parseInclude(req, options)
	const queryObject	= req.autorouteQuery || {}
	const idParameter	= options.idParameter || options.find.idParameter

	if (idParameter) {
		queryObject[idParameter] = id
	}
	else {
		queryObject._id = new options.model.base.Types.ObjectId(id)
	}

	const query = relInclude.reduce((findOne, rel) => findOne.populate(rel), options.model.findOne(queryObject)).select(req.autorouteSelect)

	return query.exec().then(result => {
		if (!result) return res.status(404).send()

		return new Promise(function(resolve) {
			if (options.translateId) {
				// reverse translate id
				return resolve(_.assign(result.toJSON(), { id: req.params.id, originalId: result.id }))
			}

			return resolve(result)
		}).then((translatedIdResult) => {
			if (options.find.processOne) {
				return Promise.resolve(options.find.processOne(translatedIdResult, req))
			}

			return translatedIdResult
		}).then(function(processedResult) {
			const serialiseFunction = _.get(options, 'find.serialise', serialise)

			res.json(serialiseFunction(processedResult, options, serialise))
		})
	})

	.then(null, function(err) {
		// eslint-disable-next-line no-console
		console.log(err)
		return next(err)
	})
}

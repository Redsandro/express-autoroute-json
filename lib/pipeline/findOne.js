/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const parseInclude	= require('../helpers/parseInclude')
const middlefy		= require('../helpers/middlefy')

module.exports = (options) => async(req, res, next) => {
	const { select }	= req.jsMini
	const meta			= {}

	try {
		const { schema, model } = options
		const relInclude	= parseInclude(req, options)
		const _id			= get(schema.tree, '_id.type.name') === 'ObjectId' ? new model.base.Types.ObjectId(req.params.id) : req.params.id
		const queryObject	= { _id, ...req.jsMini.query }
		const findOne		= model.findOne(queryObject)
		const query			= relInclude.reduce((findOne, rel) => findOne.populate(rel), findOne)
		let result

		if (options.find.query) {
			// Custom query
			result = await options.find.query(req, 'findOne')
		}
		else {
			// Default query
			result = await query.select(select).exec()
		}

		// if typeof result == Error return JAError instead
		if (!result) return res.status(404).send()

		result = middlefy(options, 'beforeSerializer', 'find', result)
		result = serializer(req, result, relInclude, meta, options)
		result = middlefy(options, 'afterSerializer', 'find', result)

		return res.json(result)
	}
	catch (err) {
		console.log('%j', Object.getOwnPropertyNames(err))
		console.log('err:', err.message, err.type, err.code)

		return next(err)
	}
}

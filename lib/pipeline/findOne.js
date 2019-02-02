/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const parseInclude	= require('../helpers/parseInclude')

module.exports = (options) => async(req, res, next) => {
	try {
		const { schema, model } = options
		const relInclude	= parseInclude(req, options)
		// const _id			= options.schema.tree._id.type === String ? req.params.id : new options.model.base.Types.ObjectId(req.params.id)
		const _id			= get(schema.tree, '_id.type.name') === 'ObjectId' ? new model.base.Types.ObjectId(req.params.id) : req.params.id
		const queryObject	= { _id }
		const findOne		= model.findOne(queryObject)
		const query			= relInclude.reduce((findOne, rel) => findOne.populate(rel), findOne)
		let result

		if (options.find.query) {
			// Custom query
			result = await options.find.query(req, 'findOne')
		}
		else {
			// Default query
			result = await query.select(req.autorouteSelect).exec()
		}

		if (!result) return res.status(404).send()
		res.json(serializer(result, options))

		return next()
	}
	catch (err) {
		console.log('%j', Object.getOwnPropertyNames(err))
		console.log('err:', err.message, err.type, err.code)

		return next(err)
	}
}

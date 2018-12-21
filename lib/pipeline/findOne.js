/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const parseInclude	= require('../helpers/parseInclude')

module.exports = (options) => async(req, res, next) => {
	const id			= req.params.id
	const relInclude	= parseInclude(req, options)
	const queryObject	= req.autorouteQuery || {}

	queryObject._id		= new options.model.base.Types.ObjectId(id)

	const findOne		= options.model.findOne(queryObject)
	const query			= relInclude.reduce((findOne, rel) => findOne.populate(rel), findOne)

	try {
		const result		= await query.select(req.autorouteSelect).exec()
		if (!result) return res.status(404).send()
		res.json(serializer(result, options))

		return next()
	}
	catch (err) {
		return next(err)
	}
}

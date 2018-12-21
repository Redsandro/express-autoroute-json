/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const parseInclude	= require('../helpers/parseInclude')

module.exports = (options) => async(req, res, next) => {
	const relInclude	= parseInclude(req, options)
	const find			= options.model.find(req.autorouteQuery)
	const query			= relInclude.reduce((findOne, rel) => findOne.populate(rel), find)

	try {
		const results = await query
			.sort(req.autorouteSort)
			.select(req.autorouteSelect)
			.lean(false)
			.exec()

		res.json(serializer(results, options))
		return next()
	}
	catch (err) {
		return next(err)
	}
}

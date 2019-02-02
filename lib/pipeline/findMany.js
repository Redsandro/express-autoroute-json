/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const parseInclude	= require('../helpers/parseInclude')

module.exports = (options) => async(req, res, next) => {
	const limit			= options.find.limit || options.args.limit || 50
	const relInclude	= parseInclude(req, options)
	const find			= options.model.find(req.autorouteQuery, { lean: false })
	const query			= relInclude.reduce((findOne, rel) => findOne.populate(rel), find)
	let results

	try {
		if (options.find.query) {
			/*
			 * If a custom query function was specified, all logic is expected to be there.
			 * All we need to do is serialize the response according to the scheme.
			 */
			results = await options.find.query(req, 'findMany')
		}
		else {
			/*
			 * Execute the default query pipeline.
			 */
			results = await query
				.sort(req.autorouteSort)
				.select(req.autorouteSelect)
				.limit(limit)
				.exec()
		}

		res.json(serializer(results, options))
		return next()
	}
	catch (err) {
		return next(err)
	}
}

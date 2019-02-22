/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const parseInclude	= require('../helpers/parseInclude')
const filter		= require('../helpers/filter')

module.exports = (options) => async(req, res, next) => {
	const pageLimit		= Math.min(+get(req.query, 'page.limit') || +get(req.query, 'page.size'), Math.max(options.args.limitMax || 0, 100))
	const limit			= pageLimit || options.find.limit || options.args.limit || 50
	const pageOffset	= +get(req.query, 'page.offset') || +get(req.query, 'page.number', 0) * limit
	const offset		= pageOffset || 0
	const relInclude	= parseInclude(req, options)
	const match			= { ...filter(req), ...req.jsMini.query }
	const find			= options.model.find(match).select(req.jsMini.select).sort(req.jsMini.sort).lean(false).skip(offset).limit(limit)
	const query			= relInclude.reduce((findOne, rel) => findOne.populate(rel), find)
	let results, count, meta = {}

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
			results	= await query.exec()
			count	= await options.model.countDocuments(match)
			meta = {...meta, count}
		}

		res.json(serializer(req, results, meta, options))
		return next()
	}
	catch (err) {
		return next(err)
	}
}

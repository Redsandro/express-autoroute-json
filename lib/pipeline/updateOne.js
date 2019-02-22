/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const getModelData	= require('../helpers/getModelData')

module.exports = (options) => async(req, res, next) => {
	if (!get(req, 'body.data')) return next(new Error('No valid JSON'))

	try {
		const _id		= req.params.id
		const data		= get(req, 'body.data')
		const query 	= { _id }
		const values	= getModelData(options, data)
		const result	= await options.model.findOneAndUpdate(query, { $set: values }, { new: true })
		const meta		= {}

		if (result) return res.json(serializer(req, result, meta, options))
	}
	catch (err) {
		if (!['CastError'].includes(err.name)) {
			return next(err)
		}
	}

	return next()
}

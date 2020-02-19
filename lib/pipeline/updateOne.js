/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const getModelData	= require('../helpers/getModelData')
const middlefy		= require('../helpers/middlefy')

module.exports = (options) => async(req, res, next) => {
	if (!get(req, 'body.data')) return next(new Error('No valid JSON'))

	try {
		const _id		= req.params.id
		const data		= get(req, 'body.data')
		const query 	= { _id }
		const values	= getModelData(options, data)
		const meta		= {}
		const include	= []
		let result		= await options.model.findOneAndUpdate(query, { $set: values }, { new: true })

		// if typeof result == Error return JAError instead
		if (!result) return res.status(404).send()

		result = middlefy(options, 'beforeSerializer', 'find', result)
		result = serializer(req, result, include, meta, options)
		result = middlefy(options, 'afterSerializer', 'find', result)

		return res.json(result)
	}
	catch (err) {
		if (!['CastError'].includes(err.name)) {
			return next(err)
		}
	}

	return next()
}

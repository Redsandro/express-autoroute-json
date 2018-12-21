/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const serializer	= require('../helpers/serializer')
const getModelData	= require('../helpers/getModelData')

module.exports = (options) => async(req, res, next) => {
	const _id		= req.params.id
	const query 	= { _id }
	const data		= getModelData(get(req, 'body.data'), {})

	try {
		const result = await options.model.findOneAndUpdate(query, { $set: data }, { new: true })
		if (!result) throw new Error('NotFound')
		res.json(serializer(result, options))

		return next()
	}
	catch (err) {
		if (err.name === 'CastError' && err.kind === 'ObjectId' || err.message === 'NotFound') {
			res.status(404).send({
				errors: [{
					detail: 'Not Found',
				}],
			})

			return next()
		}

		return next(err)
	}
}

/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */

module.exports = (options) => async(req, res, next) => {
	const _id	= req.params.id
	const query = { _id }

	try {
		const object = await options.model.findOneAndRemove(query)
		if (!object) throw new Error('NotFound')

		res.status(204).send('')
		return next()
	}
	catch (err) {
		if (err.name === 'CastError' || err.message === 'NotFound') {
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

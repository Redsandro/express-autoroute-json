/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */

module.exports = (options) => async(req, res, next) => {
	const { params : { id: _id }} = req

	try {
		if (await options.model.findOneAndDelete({ _id })) {
			return res.status(204).send('')
		}
	}
	catch (err) {
		if (!['CastError'].includes(err.name)) {
			return next(err)
		}
	}

	return next()
}

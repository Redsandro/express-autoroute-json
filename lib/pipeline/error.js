/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */

const { Error:JsonApiError } = require('jsonapi-serializer')

module.exports = (options) => (err, req, res, next) => {
	const statusCode	= err.status || 500
	const requestErr	= err.status && err.response && err.response.error
	const status		= `${statusCode}`
	const title			= requestErr && err.message || 'Internal Server Error'
	const detail		= requestErr.message || err.message || 'Unknown Error'

	if ([400, 401, 403, 404, 405, 408].includes(statusCode))
		console.error(err.message)
	else
		console.error(err)

	res.status(statusCode).json(new JsonApiError({
		status,
		title,
		detail,
		source	: {
			pointer	: req.originalUrl
		}
	}))
}

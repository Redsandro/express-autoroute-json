/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
module.exports = (options) => (err, req, res, next) => {
	console.error(err)
	res.status(500).json({
		errors: [{
			detail: err.message,
		}],
	})
}

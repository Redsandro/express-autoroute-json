/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */

module.exports = (options) => (req, res, next) => {
	const sort		= req.query.sort

	if (typeof sort === 'string') {
		req.autorouteSort = sort.split(',').join(' ')
	}

	// Defaults
	else if (options.find.sort) {
		req.autorouteSort = options.find.sort(req)
	}

	next()
}

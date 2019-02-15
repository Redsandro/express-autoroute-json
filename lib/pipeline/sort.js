/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */

module.exports = (options) => (req, res, next) => {
	const defaults	= parseSort(options.find.sort)
	const query		= parseSort(req.query.sort)

	req.jsMini.sort = { ...defaults, ...query }

	next()
}

function parseSort(sortOpts, req) {
	let desc
	if (typeof sortOpts === 'object') return sortOpts
	if (typeof sortOpts === 'function') return sortOpts(req)
	if (typeof sortOpts === 'string') {
		return sortOpts.split(',').reduce((acc, key) => {
			desc = key[0] == '-'
			if (desc) key = key.substr(1)
			acc[key] = desc ? -1 : 1
			return acc
		}, {})
	}

	return {}
}

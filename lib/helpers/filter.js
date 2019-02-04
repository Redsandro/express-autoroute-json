/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const operatorMap	= {
	'<='	: value => ({ $lte: value }),
	'>='	: value => ({ $gte: value }),
	'<'		: value => ({ $lt: value }),
	'>'		: value => ({ $gt: value }),
	':'		: value => RegExp(value, 'i'),
	'~'		: value => RegExp(`^${value}$`, 'i'),
	':~'	: value => RegExp(`${value}$`, 'i'),
	'~:'	: value => RegExp(`^${value}`, 'i'),
}
const operators		= Object.keys(operatorMap).sort((a, b) => a.length > b.length && -1 || a.length < b.length && 1)

/**
 * Convert JSON:API `filter` query string to mongo find commands
 * @param  {IncomingMessage} req
 * @param  {Object} options
 * @return {Object} MongoDB `find` query
 * @todo Parse custom filters from options.
 * @todo Split keys for filtering post-includes
 */
module.exports = (req, options) => {
	if (typeof req.query.filter == 'object') {
		return Object.entries(req.query.filter)
			.reduce((acc, curr) => {
				const [key, operation] = curr
				const operator	= operators.find(op => RegExp(`^${op}`).test(operation))
				if (operator) {
					const value		= operation.substr(operator.length)
					acc[key]		= operatorMap[operator](value)
				}
				else if (operation.length >= 3 && operation.includes(',')) {
					acc[key]		= { $in: operation.split(',') }
				}
				else acc[key]		= operation

				return acc
			}, {})
	}

	return {}
}

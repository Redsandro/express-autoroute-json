/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const operatorMap	= {
	'<='	: [ value => ({ $lte: value }) ],
	'>='	: [ value => ({ $gte: value }) ],
	'<'		: [ value => ({ $lt: value }) ],
	'>'		: [ value => ({ $gt: value }) ],
	':'		: [ value => RegExp(value, 'i') ],
	'~'		: [ value => RegExp(`^${value}$`, 'i') ],
	':~'	: [ value => RegExp(`${value}$`, 'i') ],
	'~:'	: [ value => RegExp(`^${value}`, 'i') ],
	'!'		: [ value => ({ $ne: value }), values => ({ $nin: values }) ],
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
			.reduce((acc, [key, expression]) => {
				const operator	= operators.find(op => RegExp(`^${op}`).test(expression))

				if (key == 'id') key = '_id'
				if (key == '$text') acc[key] = typeof expression == 'string' ? {$search: expression} : expression // allow both search string and options object
				else if (operator) {
					const ops		= operatorMap[operator]
					const value		= expression.substr(operator.length)
					if (value.includes(',') && ops.length > 1)
						acc[key]	= ops[1](value.split(','))
					else
						acc[key]	= ops[0](value)
				}
				else if (expression.length >= 3 && expression.includes(',')) {
					acc[key]		= { $in: expression.split(',') }
				}
				else acc[key]		= expression

				return acc
			}, {})
	}

	return {}
}

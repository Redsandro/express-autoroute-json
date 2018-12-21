/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */

module.exports = (options) => async(req, res, next) => {
	const modelType		= get(options, 'model.collection.name')
	const fields		= get(req, 'query.fields')
	const select		= []

	if (fields) {
		//TODO: This needs work. Mongoose populate can chain forever, in JSON:API relationships are included on the root level.
		for (const [key, value] of Object.entries(fields)) {
			const parent = key === modelType ? '' : `${key}.`

			select.push.apply(select, value.split(',').map(field => `${parent}${field}`))
		}
		req.autorouteSelect = select.join(' ')
	}
	else {
		// Add in the defaults specified in the route
		if (options.find.select) {
			let fieldStr = options.find.select(req)

			if (Array.isArray(fieldStr)) fieldStr = fieldStr.join(' ')

			req.autorouteSelect = fieldStr
		}
	}

	return next()
}

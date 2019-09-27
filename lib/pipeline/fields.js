/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const camelcase		= require('camelcase')

module.exports = (options) => async(req, res, next) => {
	const modelType		= get(options, 'model.collection.name')
	const fields		= getFields(options, req)
	const { select }	= req.jsMini

	if (fields) {
		if (typeof fields != 'object') return next(new Error('Fields parameter should be an object.'))

		//TODO: This needs work. Mongoose populate can chain forever, in JSON:API relationships are included on the root level.
		for (const [key, value] of Object.entries(fields)) {
			const parent	= key === modelType ? '' : `${key}.`

			value.split(',').reduce((acc, curr) => {
				const field		= curr.replace(/^[+-]/, '').trim()
				const attribute	= camelcase(field, false)
				const state		= curr[0] == '-' ? 0 : 1
				acc[`${parent}${attribute}`] = state
				return acc
			}, select)
		}
	}
	else {
		//TODO: Deprecate
		// Add in the defaults specified in the route
		if (options.find.fields) {
			let fieldStr = options.find.fields(req)

			if (Array.isArray(fieldStr)) fieldStr = fieldStr.join(' ')

			req.jsMini.fields = fieldStr
		}
	}

	return next()
}

function getFields(options, req) {
	const modelType	= get(options, 'model.collection.name')
	const fields	= get(req.query, 'fields') || options.find.fields

	switch (typeof fields) {
		case 'string':
			return { [modelType]: fields }
		case 'object':
			return fields
		case 'function':
			return fields(req)
		default:
			return fields
	}
}

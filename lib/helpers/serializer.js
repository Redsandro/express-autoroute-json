const pluralize = require('pluralize')
const JSONAPISerializer = require('jsonapi-serializer').Serializer
const _ = require('lodash')

module.exports = function(data, options) {
	const type			= pluralize(options.resource || options.model.collection.name)
	const keys			= options.attributes || Object.keys(options.model.schema.paths)
	const attributes	= keys.filter(key => key[0] != '_')
	const schema		= {
		attributes,
		typeForAttribute(attribute) {
			const refType = getRefType(options, attribute)
			return refType ? pluralize(refType).toLowerCase() : attribute
		},
	}

	attributes.forEach(function(attribute) {
		const refType		= getRefType(options, attribute)
		if (refType) {
			const doc			= Array.isArray(data) ? data[0] : data
			const ref			= Array.isArray(doc[attribute]) ? doc[attribute][0] : doc[attribute]
			const relationship	= get(ref, 'constructor.name') == 'model'

			// Is this relationship data or a relationship reference?
			if (relationship) {
				// Relationship data to be included under `includes`
				schema[attribute] = {
					ref: 'id',
					attributes: Object.keys(ref.toJSON()).filter(key => !/^_/g.test(key)),
				}
			}
			else {
				// Relationship reference
				schema[attribute] = {
					ref: true,
				}
			}
		}
	})

	const serializer = new JSONAPISerializer(type, schema)

	return serializer.serialize(data)
}

function getRefType(options, attribute) {
	const pathOptions	= get(options.schema.paths, `${attribute}.options`, {})

	return get(pathOptions, 'ref') || get(pathOptions, 'type.0.ref')
}

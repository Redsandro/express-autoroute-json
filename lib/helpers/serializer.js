const pluralize		= require('pluralize')
const Serializer	= require('jsonapi-serializer').Serializer

module.exports = function(req, data, meta, options) {
	const { includes, select } = req.jsMini
	const type			= pluralize(options.model.collection.name)
	const keys			= Object.keys(options.model.schema.paths).filter(key => key[0] != '_')
	const fields		= Object.entries(select).filter(entry => entry[1] == 1).map(entry => entry[0])
	const attributes	= keys.filter(key => !fields.length || fields.includes(key) || includes.includes(key))
	const schema		= {
		attributes,
		typeForAttribute(attribute) {
			const refType	= options.relationships[attribute]
			return refType ? pluralize(refType).toLowerCase() : attribute
		}
	}

	attributes.forEach(function(attribute) {
		const refType		= options.relationships[attribute]
		if (refType) {
			const doc			= Array.isArray(data) ? data[0] : data
			const ref			= doc && (Array.isArray(doc[attribute]) ? doc[attribute][0] : doc[attribute])
			const relationship	= ref && get(ref, 'constructor.name') == 'model'

			// Is this relationship data or a relationship reference?
			if (relationship) {
				// Relationship data to be included under `includes`
				schema[attribute] = {
					ref			: 'id',
					attributes	: Object.keys(ref.toJSON()).filter(key => !/^_/g.test(key)),
				}
			}
			else {
				// Relationship reference
				schema[attribute] = {
					ref			: true,
				}
			}
		}
	})

	// Add metadata
	if (Object.keys(meta).length) {
		schema.meta = meta
	}

	const serializer	= new Serializer(type, schema)

	return serializer.serialize(data)
}

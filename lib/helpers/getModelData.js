/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const camelcaseKeys = require('camelcase-keys')

module.exports = getModelData

/**
 * Convert JSON:API document to mongoose model data
 * @param  {Object} attributes    Submitted attributes
 * @param  {Object} relationships Submitted relationships
 * @return {Object}               Mongoose data
 */
function getModelData(options, data) {
	const attributes	= camelcaseKeys(get(data, 'attributes', {}))
	const relationships	= camelcaseKeys(get(data, 'relationships', {}))

	return Object.keys(relationships).reduce((model, relationship) => {
		const value			= relationships[relationship]
		model[relationship] = Array.isArray(value.data)
			// One-to-many
			? value.data.map(rel => rel.id).filter(Boolean)
			// One-to-one
			/**
			 * __NOTE:__ `get(value, 'data.id')` is failing for data specifically.
			 * @see https://github.com/Redsandro/jsonapi-server-mini/issues/6#issuecomment-510521126
			 */
			: value && value.data && value.data.id
		return model
	}, attributes)
}

/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */

/**
 * Verify requested include parameters. We only return direct relationships
 * defined in the schema. Not made up ones.
 *
 * "Intermediate resources in a multi-part path must be returned along with
 * the leaf nodes. For example, a response to a request for `comments.author`
 * should include `comments` as well as the `author` of each of those comments."
 *
 * @example
 * ```javascript
 * // Return all requested relationships:
 * module.exports.autoroute = autorouteJson({
 *   model: Person,
 *   allowInclude: true,
 *
 *   find: {},
 *   // ...
 * });
 *
 * // Only return relationships that are whitelisted:
 * module.exports.autoroute = autorouteJson({
 *   model: Person,
 *   allowInclude: ['spouse', 'pets'],
 *
 *   find: {},
 *   // ...
 * });
 * ```
 * @param  {Object} req     Express request object
 * @param  {Object} options Holds the Schema to the Model
 * @return {Array}          Array of legal (parent) resources
 */
module.exports = (req, options) => {
	const allowInclude	= options.allowInclude !== false
	const whitelist		= Array.isArray(options.allowInclude) ? options.allowInclude : []
	let include			= req.query.include ? req.query.include.split(',') : []

	// Only allow nodes that are accepted by the route configuration
	include = include.filter(relationship => allowInclude || whitelist.includes(relationship))

	// Get root nodes
	include = include.map(relationship => String(relationship).split('.')[0])

	// Remove duplicates
	include = include.filter((relationship, index) => include.indexOf(relationship) === index)

	// Only return direct relationships defined in the schema
	include = include.filter((relationship) => {
		const relOptions = get(options.model.schema.paths, `${relationship}.options`)
		return get(relOptions, 'ref') || get(relOptions, 'type.0.ref')
	})

	req.jsMini.includes = include

	return include
}

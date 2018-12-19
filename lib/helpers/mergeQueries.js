/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @author Stone Circle <info@stonecircle.ie> (https://www.stonecircle.ie)
 * @license MIT
 */
const _ = require('lodash')

module.exports = function(first, second) {
	const commonKeys = _.intersection(first ? _.keys(first) : [], second ? _.keys(second) : [])
	const output = _.extend(_.omit(first || {}, commonKeys), _.omit(second || {}, commonKeys))

	_.each(commonKeys, function() {
		output.$and = [first, second]
	})
	return output
}

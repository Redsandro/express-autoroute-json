/**
 * Apply single argument middleware to results.
 * @param  {Object} options    Route definion
 * @param  {String} middleware Name of expected middleware
 * @param  {String} method     Method for this middleware
 * @param  {Object|Array} data Results on which to apply the middleware
 * @return {Object|Array}      Mutated results
 */
module.exports = function middlefy(options, middleware, method, data) {
	const middlewares = [
		`${method}.middleware.${middleware}`,		// method
		`middleware.${middleware}`,					// route
		`args.middleware.${middleware}`,			// global
	]

	return middlewares.reduce((data, path) => {
		const fn = get(options, path, null)
		if (typeof fn == 'function') return fn(data)
		return data
	}, data)
}

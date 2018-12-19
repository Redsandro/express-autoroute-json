const _ = require('lodash')

const mergeQueries = require('./helpers/mergeQueries')

module.exports = function(options) {
	return function(req, res, next) {
		if (options && options.find && options.find.query) {
			const query = options.find.query(req)

			if (query) {
				_.assign(req, {
					autorouteQuery: mergeQueries(req.autorouteQuery, query),
				})
			}
		}
		next()
	}
}

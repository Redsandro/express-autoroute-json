const _ = require('lodash')

const defaultSerialise = require('./serialise')

module.exports = function(options) {
	return function(req, res, next) {
		req.model.save(function(err, result) {
			const serialiseFunction = _.get(options, 'find.serialise', defaultSerialise)

			if (err) {
				return next(err)
			}

			res.status(201).json(serialiseFunction(result, options))

			return next()
		})
	}
}

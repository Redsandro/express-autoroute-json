const _ = require('lodash')

const defaultSerialise = require('./serialise')
const parseInclude = require('./parseInclude')

module.exports = function(options) {
	return function(req, res) {
		const isLean = options.find.lean ? options.find.lean : false
		const relInclude = parseInclude(req, options)
		const query = relInclude.reduce(
			(findOne, rel) => findOne.populate(rel), options.model.find(req.autorouteQuery)
		).sort(req.autorouteSort).select(req.autorouteSelect).lean(isLean)

		return query.exec().then(function(results) {
			if (options.find.process) {
				if (options.find.process.length === 3) {
					// eslint-disable-next-line no-console
					console.warn(`You are using deprecated version of process.
it now has 2 parameters (results, req)`)
					return Promise.resolve(options.find.process(results, null, req))
				}
				return Promise.resolve(options.find.process(results, req))
			}
			return results
		}).then(function(results) {
			const serialiseFunction = _.get(options, 'find.serialise', defaultSerialise)

			res.json(serialiseFunction(results, options, defaultSerialise))
		}).then(null, (err) => {
			// eslint-disable-next-line no-console
			console.log(err)
			res.status(500).send(err.message)
		})
	}
}

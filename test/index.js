const path		= require('path')
const jsMini	= require('../index.js')
const { Validator } = require('jsonschema')

global.app = jsMini({
	routes: path.join(__dirname, 'routes'),
})

global.validateJSONAPI = function(res) {
	const validator = new Validator()
	const result = validator.validate(res.body, require('./schema.json'))

	if (!result.valid) {
		console.log(res.text)
		console.log('%j', res.body)
		throw new Error(result.errors)
	}

	return res
}

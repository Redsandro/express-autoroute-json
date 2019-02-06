const path		= require('path')
const jsMini	= require('../index.js')
const mongoose	= require('mongoose')
const { Validator } = require('jsonschema')

global.app = jsMini({
	routes: path.join(__dirname, 'routes'),
	mongoose
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

before('Set up database', async function() {
	if (process.env.NODE_ENV === 'test') {
		// Remove old tests
		await mongoose.connection.dropDatabase()

		// Insert test data
		// for (const i of [1, 2, 3]) {
		// 	const Person = mongoose.model('Person')
		// 	const person = new Person({
		// 		name	: `Redsandro ${i}`,
		// 		age		: i
		// 	})
		// 	await person.save()
		// }
	}
	else throw new Error('This is not a testing environment. You will nuke your database.')

	return true
})

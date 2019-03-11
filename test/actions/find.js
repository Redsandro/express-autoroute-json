const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Finding Resources', function() {
	let Animal, Person
	const animals = []
	const people = []
	before('Set up database', async function() {
		if (process.env.NODE_ENV === 'test') {
			Animal	= mongoose.model('Animal')
			Person	= mongoose.model('Person')

			await Animal.deleteMany({}) //FIXME: Contains Tiger and Dogmeat from other test

			for (const i of [1, 2, 3, 4, 5]) {
				const animal = new Animal({
					name: `Avogato ${i}`
				})
				await animal.save()
				animals.push(animal.get('_id'))
				const person = new Person({
					name: `Thunderhenk ${i}`,
					pets: [
						animal.get('_id')
					]
				})
				await person.save()
			}
		}

		else throw new Error('This is not a testing environment. You will nuke your database.')
	})

	it('should return one random sample', async function() {
		return chai.request(await global.app)
			.get('/animals')
			.query({sample: 1})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(1)
				res.body.should.have.nested.property('meta.count', 1)
			})
	})

	it('should return multiple random samples', async function() {
		return chai.request(await global.app)
			.get('/animals')
			.query({
				sample: 2,
				filter: {
					name: '~:Avogato'
				}
			})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(2)
				res.body.should.have.nested.property('meta.count', 2)
			})
	})

	it('should return random samples with relationships', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({
				sample: 2,
				include: 'pets',
				filter: {
					name: '~:Thunderhenk'
				}
			})
			.then(res => {
				const { body } = res
				console.log('%j', body)

				res.should.have.status(200)
				body.data.should.have.lengthOf(2)
				body.should.have.nested.property('meta.count', 2)
				body.data[0].should.have.property('id')
				body.included.should.have.lengthOf(2)
				body.should.have.nested.property('included[0].attributes.name')
				body.included[0].attributes.name.should.match(/^Avogato/)
			})
	})
})

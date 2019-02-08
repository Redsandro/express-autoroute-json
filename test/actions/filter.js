const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Filtering Resources', function() {
	let dog, cat, Animal, Person
	before('Set up database', async function() {
		if (process.env.NODE_ENV === 'test') {
			Animal	= mongoose.model('Animal')
			Person	= mongoose.model('Person')

			await Animal.deleteMany({})
			await Person.deleteMany({})

			dog		= new Animal({name: 'Dogmeat'})
			cat		= new Animal({name: 'Tiger'})
			dog.save()
			cat.save()

			for (const i of [1, 2, 3, 4, 5, 6]) {
				let name = `I am ${i}`
				if (i > 4) name = `My name is Alexander The Great ${i}`
				const person = new Person({
					name,
					age		: i,
					pets	: [dog, cat]
				})
				await person.save()
			}
		}

		else throw new Error('This is not a testing environment. You will nuke your database.')
	})

	it('should filter "lt" (<)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				age: '<3'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(2)
			})
	})

	it('should filter "lte" (<=)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				age: '<=3'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(3)
			})
	})

	it('should filter "gt" (>)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				age: '>3'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(3)
			})
	})
	it('should filter "gte" (>=)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				age: '>=3'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(4)
			})
	})
	it('should filter "not" (!)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				age: '!3'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(5)
			})
	})
	it('should filter "like" (:)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				name: ':alexander'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(2)
			})
	})
	it('should filter expression (~)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				name: '~i am.+'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(4)
			})
	})
	it('should filter "startswith" (~:)')
	it('should filter "endswith" (:~)')
	it('should filter by array element attribute.0')
})

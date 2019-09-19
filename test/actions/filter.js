const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Filtering Resources', function() {
	let dog, cat, Animal, Person, Project
	before('Set up database', async function() {
		if (process.env.NODE_ENV === 'test') {
			Animal	= mongoose.model('Animal')
			Person	= mongoose.model('Person')
			Project	= mongoose.model('Project')

			await Animal.deleteMany({})
			await Person.deleteMany({})
			await Project.deleteMany({})

			dog		= new Animal({name: 'Dogmeat'})
			cat		= new Animal({name: 'Tiger'})
			dog.save()
			cat.save()

			for (const i of [1, 2, 3, 4, 5, 6]) {
				let name = `I am ${i}`
				if (i == 4) name = 'Well, I won\'t tell, my name is a secret.'
				if (i > 4) name = `My name is Alexander The Great ${i}`
				const person = new Person({
					name,
					age		: i,
					pets	: [dog, cat]
				})
				await person.save()
			}

			(new Project({
				title		: 'Dog grooming',
				description	: 'Man plans to groom dogs.',
			})).save();
			(new Project({
				title		: 'Girl pets cat',
				description	: 'In celebration of cat petting.',
			})).save()
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

	it('should filter multiple "not" (!2,3,4)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				age: '!1,3,4,6'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(2)
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
				res.body.data.should.have.lengthOf(3)
			})
	})

	it('should filter expression (~) including commas', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				name: '~Well, I won\'t tell, my name is a secret.'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(1)
			})
	})

	it('should filter "startswith" (~:)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				name: '~:i am'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(3)
			})
	})

	it('should filter "endswith" (:~)', async function() {
		return chai.request(await global.app)
			.get('/people')
			.query({ filter: {
				name: ':~secret.'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(1)
			})
	})

	it('should filter by $text $search', async function() {
		return chai.request(await global.app)
			.get('/projects')
			.query({ filter: {
				$text: 'dog'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.data.should.have.lengthOf(1)
			})
	})

	it('should filter by array element attribute.0')
})

describe('Projecting Fields', function() {
	it('should select fields from find.fields object')
	it('should select fields from find.fields function')
	it('should select fields from query.fields query string')
})

describe('Sorting Resources', function() {
	it('should sort by find.sort string')
	it('should sort by find.sort object')
	it('should sort by find.sort function')
	it('should sort by query.sort string')
})

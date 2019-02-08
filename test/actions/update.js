const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Updating Resources', function() {
	let dog, cat, Animal, Person, id, person
	before('Set up database', async function() {
		if (process.env.NODE_ENV === 'test') {
			Animal	= mongoose.model('Animal')
			Person	= mongoose.model('Person')
			dog		= new Animal({name: 'Dogmeat'})
			cat		= new Animal({name: 'Tiger'})
			dog.save()
			cat.save()

			// for (const i of [1, 2, 3]) {
			// 	const person = new Person({
			// 		name	: `Redsandro ${i}`,
			// 		age		: i,
			// 		pets	: [dog, cat]
			// 	})
			// 	await person.save()
			// }
		}
		else throw new Error('This is not a testing environment. You will nuke your database.')
	})
	beforeEach(async function() {
		if (process.env.NODE_ENV === 'test') {
			person = new Person({
				name	: 'Sir Redsandro',
				age		: 541,
				pets	: [dog, cat]
			})
			await person.save()
			id = person.id
			return id
		}
		else throw new Error('This is not a testing environment. You will nuke your database.')
	})

	it('should return 404 when id is invalid type for model', async function() {
		return chai.request(await global.app)
			.patch('/chats/ThisIdClearlyDoesNotExist')
			.type('application/vnd.api+json')
			.send({ data: {
				attributes: {
					name: 'name',
					count: 0,
				},
			}})
			.then(res => res.should.have.status(404) && res)
			.then(global.validateJSONAPI)
	})

	it('should return 404 when resource does not exist', async function() {
		return chai.request(await global.app)
			.patch(`/chats/${ObjectId()}`)
			.type('application/vnd.api+json')
			.send({ data: {
				attributes: {
					name: 'name',
					count: 0,
				},
			}})
			.then(res => res.should.have.status(404) && res)
			.then(global.validateJSONAPI)
	})

	it('should ignore bad attributes', async function() {
		const myId = await chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					name: 'Test',
				}
			}})
			.then(res => res.body.data.id)

		const originalData = await chai.request(await global.app)
			.get(`/people/${myId}`)
			.then(res => res.body)

		const patchedData = await chai.request(await global.app)
			.patch(`/people/${myId}`)
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					secret: 'My Little Pony',
				}
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.should.not.have.nested.property('data.attributes.secret')
				return res
			})
			.then(res => res.body)

		return await chai.request(await global.app)
			.get(`/people/${myId}`)
			.then(res => res.body)
			.then(newData => {
				expect(originalData).to.deep.equal(patchedData)
				expect(originalData).to.deep.equal(newData)
			})
	})

	it('should return updated document', async function() {
		const body = await chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					name: 'Test',
				}
			}})
			.then(res => res.body)

		return await chai.request(await global.app)
			.patch(`/people/${body.data.id}`)
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					name: 'Milo',
				}
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.should.have.nested.property('data.attributes.name', 'Milo')
				return res
			})
	})

	it('should only change patched attributes', async function() {
		const newId = ObjectId()
		const body = await chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					name: 'Youngster',
					age: 1
				},
				relationships: {
					pets: {
						data: [{type: 'Animal', id: newId}]
					}
				}
			}})
			.then(res => res.should.have.status(201) && res)
			.then(res => res.body)

		return await chai.request(await global.app)
			.patch(`/people/${body.data.id}`)
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					age: 2,
				}
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.should.nested.include({
					'data.attributes.name': 'Youngster',
					'data.attributes.age': 2,
				})
				expect(res.body.data.relationships.pets.data[0]).to.have.property('id', newId.toString())
				return res
			})
	})

	it('should convert dasherized patch to camelCase')
})

describe('Updating Relationships', function() {
	it('should remove relationship with patch', async function() {
		const newId = ObjectId()
		const body = await chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					name: 'Youngster',
					age: 1
				},
				relationships: {
					pets: {
						data: [{type: 'Animal', id: newId}]
					}
				}
			}})
			.then(res => res.should.have.status(201) && res)
			.then(res => res.body)

		return await chai.request(await global.app)
			.patch(`/people/${body.data.id}`)
			.type('application/vnd.api+json')
			.send({ data: {
				type: 'people',
				attributes: {
					age: 49
				},
				relationships: {
					pets: {
						data: []
					},
				}
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.should.nested.include({
					'data.attributes.name': 'Youngster',
					'data.attributes.age': 49,
				})
				expect(res.body.data.relationships.pets.data).to.be.empty
				return res
			})
	})

	it('should add one-to-one (object) relationship with patch')

	it('should add one-to-many (array) relationship with patch')

	it('should patch relationships independently (PATCH /articles/1/relationships/author)')
})

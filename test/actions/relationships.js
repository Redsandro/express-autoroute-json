const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Creating Relationships', function() {
	it('add one-to-one relationships from request body', async function() {
		const spouseId = new ObjectId()
		return chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'people',
					attributes: {
						name: 'namey mc nameface',
						age: 29,
					},
					relationships: {
						spouse: {
							data: {
								type: 'people',
								id: spouseId,
							},
						},
					},
				},
			})
			.then(res => {
				res.should.have.status(201)
				res.body.should.have.nested.property('data.id')
				res.body.should.have.nested.property('data.attributes.name', 'namey mc nameface')
				res.body.should.have.nested.property('data.relationships.spouse.data.id', spouseId.toString())

				return global.validateJSONAPI(res)
			})
	})

	it('add one-to-many relationships from request body', async function() {
		const dogId = new ObjectId()
		const catId = new ObjectId()
		return chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'people',
					attributes: {
						name: 'namey mc nameface',
						age: 29,
					},
					relationships: {
						pets: {
							data: [{
								type: 'animals',
								id: dogId,
							}, {
								type: 'animals',
								id: catId,
							}],
						},
					},
				},
			})
			.then(res => {
				const {body, body:{data: {relationships}} } = res
				res.should.have.status(201)
				body.should.have.nested.property('data.id')
				body.should.have.nested.property('data.attributes.name', 'namey mc nameface')
				relationships.pets.data.should.deep.include({
					type: 'animals',
					id: dogId.toString(),
				})
				relationships.pets.data.should.deep.include({
					type: 'animals',
					id: catId.toString(),
				})

				return global.validateJSONAPI(res)
			})
	})

	it('dasherized relationship should be camelCased internally', async function() {
		const inlawId = new ObjectId()
		return chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'people',
					attributes: {
						name: 'namey mc nameface',
						age: 29,
					},
					relationships: {
						'in-law': {
							data: {
								type: 'people',
								id: inlawId,
							},
						},
					},
				},
			})
			.then(res => {
				const { body } = res

				res.should.have.status(201)
				body.should.have.nested.property('data.relationships.in-law.data.id', inlawId.toString())

				return res
			})
			.then(global.validateJSONAPI)
			.then(res => mongoose.model('Person').findOne({_id: res.body.data.id}))
			.then(person => {
				person.should.have.property('inLaw')
			})
	})

	it('should not have a relationship if it is not on the request body', async function() {
		return chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'people',
					attributes: {
						name: 'namey mc nameface',
						age: 29,
					},
				},
			})
			.then(res => {
				const { body } = res

				res.should.have.status(201)
				body.should.have.nested.property('data.id')
				body.should.deep.nested.include({
					'data.attributes.name': 'namey mc nameface',
					'data.relationships.spouse.data': null,
					'data.relationships.pets.data': []
				})

				return res
			})
			.then(global.validateJSONAPI)
	})

	it('should not add relationships that are not on the model', async function() {
		const monkeyfaceId = ObjectId()
		return chai.request(await global.app)
			.post('/people')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'people',
					attributes: {
						name: 'namey mc nameface',
						age: 29,
					},
					relationships: {
						monkeyface: {
							type: 'people',
							data: monkeyfaceId,
						},
					},
				},
			})
			.then(res => {
				const { body } = res

				res.should.have.status(201)
				body.should.have.nested.property('data.id')
				body.should.not.have.deep.property('data.relationships.monkeyface')
				body.should.deep.nested.include({
					'data.attributes.name': 'namey mc nameface',
					'data.relationships.spouse.data': null,
					'data.relationships.pets.data': []
				})

				return res
			})
			.then(global.validateJSONAPI)
	})
})

const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Pagination', function() {
	let Animal
	before('Set up database', async function() {
		if (process.env.NODE_ENV === 'test') {
			Animal	= mongoose.model('Animal')

			await Animal.deleteMany({}) //FIXME: Contains Tiger and Dogmeat from other test

			for (const i of [1, 2, 3, 4, 5, 6, 7]) {
				const animal = new Animal({
					name: `Dogbark ${i}`
				})
				await animal.save()
			}
		}

		else throw new Error('This is not a testing environment. You will nuke your database.')
	})

	it('should return meta.count', async function() {
		return chai.request(await global.app)
			.get('/animals')
			.query({ filter: {
				name: '~:Dogbark'
			}})
			.then(res => {
				res.should.have.status(200)
				res.body.should.have.nested.property('meta.count', 7)
			})
	})

	it('should respond to page[number] and page[size]')
	it('should respond to page[offset] and page[limit]')
})

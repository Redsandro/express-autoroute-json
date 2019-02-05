const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Deleting Resources', function() {
	it('should return 404 when id is invalid type for model')

	it('should return 404 when resource does not exist', async function() {
		return chai.request(await global.app)
			.delete(`/chats/${ObjectId()}`)
			.then(res => {
				res.should.have.status(404)
				return res
			})
			.then(global.validateJSONAPI)
	})

	it('should return 204 with empty body on success', async function() {
		const id = await chai.request(await global.app)
			.post('/chats')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'chats',
					attributes: {
						name: 'Delete Me'
					}
				}
			})
			.then(res => {
				res.should.have.status(201)
				res.body.should.have.nested.property('data.id')
				const id = res.body.data.id
				assert.equal(new ObjectId(id), id)
				return id
			})

		// Check database for precense
		await mongoose.model('Chat')
			.findOne({_id: id})
			.then(doc => expect(doc).to.be.ok)

		// Add document
		await chai.request(await global.app)
			.delete(`/chats/${id}`)
			.then(res => {
				res.should.have.status(204)
				res.body.should.be.empty
			})

		// Check database for absence
		await mongoose.model('Chat')
			.findOne({_id: id})
			.then(doc => expect(doc).to.not.be.ok)
	})
})

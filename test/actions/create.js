const path = require('path')
const jsMini	= require('../../index.js')
const chai = require('chai')
const chaiHttp = require('chai-http')

chai.should()
chai.use(chaiHttp)

describe('the create block', function() {

	it('should return status 201 if create exists', async function() {
		const app = await jsMini({
			// routes: path.join(process.cwd(), 'test', 'fixtures', 'create'),
			routes: path.join(__dirname, '..', 'fixtures', 'create'),
		})

		return chai.request(app)
			.post('/chats')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'chats',
					attributes: {
						name: 'myName'
					}
				}
			})
			.then(res => {
				res.should.have.status(201)
				res.body.should.be.a('object')
				res.body.should.have.nested.property('data.id')
				res.body.should.nested.include({
					'data.type': 'chats',
					'data.attributes.name': 'myName'
				})

				// done()
			})
	})
})

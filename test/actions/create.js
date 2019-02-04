const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Creating Resources', function() {
	it('The POSTed resource object MUST contain at least a type member (error)')

	it('return status 201 with document', async function() {
		const id = await chai.request(await global.app)
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
				const id = res.body.data.id
				assert.equal(new ObjectId(id), id)
				return id
			})

		return chai.request(await global.app)
			.get(`/chats/${id}`)
			.then(res => {
				res.should.have.status(200)
				res.body.should.be.a('object')
				res.body.should.nested.include({
					'data.attributes.name': 'myName'
				})
			})
	})

	it('should read dasherized attributes', async function() {
		return chai.request(await global.app)
			.post('/projects')
			.type('application/vnd.api+json')
			.send({
				data: {
					type: 'projects',
					attributes: {
						title		: 'face',
						description	: 'facey face',
						'project-start': '2016-08-18T23:00:00.000Z',
						'project-end': '2016-08-30T23:00:00.000Z',
						tags		: ['one-tag', 'two-tag', 'three-tag', 'face'],
						'is-active'	: false,
					},
				},
			})
			.then(res => {
				res.should.have.status(201)
				return mongoose.model('Project').findOne({
					_id: res.body.data.id,
				})
			})
			.then(function(project) {
				project.should.have.property('title', 'face')
				project.should.have.property('description', 'facey face')
				project.should.have.property('projectStart')
				expect(project.projectStart.getTime()).to.equal(new Date('2016-08-18T23:00:00.000Z').getTime())
				project.should.have.property('projectEnd')
				expect(project.projectEnd.getTime()).to.equal(new Date('2016-08-30T23:00:00.000Z').getTime())
				project.should.have.property('tags')
				project.should.have.property('isActive', false)
			})
	})
})

const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Indexes', function() {
	it('should create index defined by schema')
	it('should create a single compound index')
	it('should create multiple compound indexes')
})

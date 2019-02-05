const chai		= require('chai')
const chaiHttp	= require('chai-http')
const mongoose	= require('mongoose')
const { ObjectId } = mongoose.Types
const { assert, expect } = chai

chai.should()
chai.use(chaiHttp)

describe('Filtering Resources', function() {
	it('should filter "lt" (<)')
	it('should filter "lte" (<=)')
	it('should filter "gt" (>)')
	it('should filter "gte" (>=)')
	it('should filter "like" (:)')
	it('should filter expression (~)')
	it('should filter "startswith" (~:)')
	it('should filter "endswith" (:~)')
	it('should filter by array element attribute.0')
})

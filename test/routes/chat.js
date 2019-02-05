module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		count	: Number
	}),

	create	: {},
	find	: {},
	delete	: {}
})

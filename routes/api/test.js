module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		email	: String
	}),

	create	: {},
	find: {}
})

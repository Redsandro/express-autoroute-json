module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name	: String,
		email	: String,

		myTests	: [{
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}],
		lastUsed	: {
			type	: mongoose.Schema.Types.ObjectId,
			ref		: 'Test'
		}
	}),

	create	: {},
	find	: {},	//TODO: Rename to read
	update	: {},
	delete	: {}
})

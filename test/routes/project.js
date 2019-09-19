module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		title		: String,
		description	: String,
		projectStart: Date,
		projectEnd	: Date,
		tags		: [String],
		isActive	: Boolean
	}),

	indexes	: {
		title		: 'text',
		description	: 'text'
	},

	create	: {},
	find	: {}
})

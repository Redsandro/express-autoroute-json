module.exports = ({mongoose}) => ({
	schema	: new mongoose.Schema({
		name: String,
		age: Number,
		inLaw: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Person',
		},
		spouse: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Person',
		},
		pets: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Animal',
		}],
	}),

	create	: {},
	find	: {}
})

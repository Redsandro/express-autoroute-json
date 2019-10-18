/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const routeFactory	= require('./lib/routeFactory')
const path			= require('path')
const recursive		= require('recursive-readdir')
const bodyParser	= require('body-parser')
const cors			= require('cors')
const morgan		= require('morgan')
const JSONAPIError	= require('jsonapi-serializer').Error

const methodMap		= {
	post	: 'C   ',
	get		: ' R  ',
	patch	: '  U ',
	delete	: '   D'
}

const testEnv		= process.env.NODE_ENV == 'test'
const devEnv		= process.env.NODE_ENV == 'development'
const prodEnv		= process.env.NODE_ENV == 'production'

global.get = (obj, path, fallback) => path.split('.').every(el => ((obj = obj[el]) !== undefined)) ? obj : fallback

module.exports = async(args = {}) => {
	const logger		= getLogger(args)
	const mongoose		= await getMongoose(args)
	const app			= getApp(args)
	const routes		= getRoutes(args)
	const files			= await recursive(routes, [(file, stats) => stats.isFile() && file.substr(-3) !== '.js'])

	files.forEach(file => {
		const prefix		= path.dirname(file.replace(routes, '')).replace(/^\/$/, '')
		const type			= path.basename(file, '.js').replace(/^\w/, c => c.toUpperCase())
		const route			= require(file)({mongoose})
		const model			= mongoose.model(type, route.schema)
		const indexes		= route.indexes
		const relationships	= getRefs(route.schema)
		const options		= { model, args, relationships, ...route }
		const crud			= routeFactory(options)

		for (const method in crud) {
			for (const path in crud[method]) {
				app[method].apply(app, [`${prefix}${path}`].concat(crud[method][path]))
				logger.verbose(`Added [${methodMap[method]}] ${prefix}${path}`)
			}
		}

		// While nice for development, it is recommended this behavior be disabled in production.
		// TODO: Let's make this configurable.
		if (indexes) {
			[].concat(route.indexes).forEach(index => route.schema.index(index))
			model.createIndexes(err => err && logger.error(err.message))
		}
	})

	// Path does not exist
	app.use((req, res, next) => {
		if (!res.headersSent) {
			res.status(404).json(new JSONAPIError({
				status	: '404',
				title	: 'Not Found',
				detail	: `Cannot ${req.method} ${req.url}`,
				source	: {
					pointer	: req.originalUrl
				}
			}))
		}
		next()
	})

	// An error was thrown
	app.all((err, req, res, next) => {
		if (res.headersSent) return next(err)

		res.status(500).json(new JSONAPIError({
			status	: '500',
			title	: 'Internal Server Error',
			details	: err.message,
			source	: {
				pointer	: req.originalUrl
			}
		}))
	})

	if (!args.app) app.listen(args.port || 8888)

	return app
}

/**
 * Set up default logger
 * Make sure to do this first, as other functions will use the logger.
 */
function getLogger(args) {
	if (!args.logger || typeof get(args, 'logger.debug') !== 'function' || typeof get(args, 'logger.info') !== 'function') {
		args.logger = require('winston')
		const level = testEnv ? 'emerg' : prodEnv ? 'info' : devEnv ? 'debug' : 'silly'
		args.logger.add(new args.logger.transports.Console({level}))
		args.logger.verbose('Added default logger. You can specify your own winston instance using the `logger` attribute.')
	}

	return args.logger
}

/**
 * Set up default mongoose
 */
async function getMongoose(args) {
	if (!args.mongoose) {
		args.mongoose = require('mongoose')
		args.logger.verbose('Added default mongoose. You can specify your own mongoose instance using the `mongoose` attribute.')
	}

	while (args.mongoose.connection.readyState !== 1)
		await connectMongoose(args)

	return args.mongoose
}

async function connectMongoose(args, retryDelay = 1) {
	try {
		await args.mongoose.connect(args.mongoUri || 'mongodb://localhost/jsonapi-server-mini', { useNewUrlParser: true })
		return args.mongoose
	}
	catch(err) {
		args.logger.error(`Mongoose: ${err.message}`)
		args.logger.warn(`Connection to mongoose failed. Retrying in ${retryDelay} seconds.`)
		await new Promise(res => setTimeout(res, retryDelay * 1000))
		if (retryDelay < 60) retryDelay *= 2
		return await connectMongoose(args, retryDelay)
	}
}

/**
 * Set up default express when none was provided
 */
function getApp(args) {
	if (!args.app) {
		args.logger.verbose('Added default express.')

		return require('express')()
			.use(testEnv ? (req, res, next) => next() : morgan('dev'))
			.use(cors())
			.use(bodyParser.urlencoded({extended: true}))
			.use(bodyParser.json({type: 'application/vnd.api+json'}))
	}

	return args.app
}

/**
 * Set up default routes for testing purposes
 * Or just because it's cool if the app works with zero configuration
 */
function getRoutes(args) {
	if (!args.routes) {
		return path.join(__dirname, 'routes')
	}

	return args.routes
}

/**
 * Get refs/relationships from schema, so that we can have custom id's like Strings
 * @param  {Schema} schema
 * @return {Object} Map with relationshipName:idType
 */
function getRefs(schema) {
	return Object.entries(schema.paths).reduce((acc, [key, val]) => {
		const options	= get(val, 'options', {})
		const type		= get(options, 'ref') || get(options, 'type.0.ref')
		if (type) acc[key] = type
		return acc
	}, {})
}

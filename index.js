/**
 * @author Sander Steenhuis <info@redsandro.com> (https://www.Redsandro.com)
 * @license MIT
 */
const generateAutoroute = require('./lib/generateAutoroute')
const path			= require('path')
const recursive		= require('recursive-readdir')
const bodyParser	= require('body-parser')
const cors			= require('cors')
const morgan		= require('morgan')

global.get = (obj, path, fallback) => path.split('.').every(el => ((obj = obj[el]) !== undefined)) ? obj : fallback

module.exports = async(args = {}) => {
	const logger	= getLogger(args)
	const mongoose	= getMongoose(args)
	const app		= getApp(args)
	const routes	= getRoutes(args)
	const files		= await recursive(routes, [(file, stats) => stats.isFile() && file.substr(-3) !== '.js'])

	files.forEach(file => {
		const prefix		= path.dirname(file.replace(routes, ''))
		const type			= path.basename(file, '.js').replace(/^\w/, c => c.toUpperCase())
		const routeOptions	= require(file)({mongoose})

		routeOptions.model	= mongoose.model(type, routeOptions.schema)
		const route			= generateAutoroute(routeOptions)

		for (const method in route) {
			for (const path in route[method]) {
				logger.info(`creating endpoint: ${prefix}${path}`)
				app[method].apply(app, [`${prefix}${path}`].concat(route[method][path]))
			}
		}
	})

	if (!args.app) app.listen(8888)
}

/**
 * Set up default logger
 * Make sure to do this first, as other functions will use the logger.
 */
function getLogger(args) {
	if (!args.logger || typeof get(args, 'logger.debug') !== 'function' || typeof get(args, 'logger.info') !== 'function') {
		args.logger = require('winston')
		args.logger.add(new args.logger.transports.Console())
		args.logger.debug('Added default logger. You can specify your own winston instance using the `logger` attribute.')
	}

	return args.logger
}

/**
 * Set up default mongoose
 */
function getMongoose(args) {
	if (!args.mongoose) {
		args.mongoose = require('mongoose')
		args.mongoose.connect('mongodb://localhost/jsonapi-server-mini', { useNewUrlParser: true })
		args.logger.debug('Added default mongoose. You can specify your own mongoose instance using the `mongoose` attribute.')
	}

	return args.mongoose
}

/**
 * Set up default express
 */
function getApp(args) {
	if (!args.app) {
		args.logger.debug('Added default express.')

		return require('express')()
			.use(morgan('dev'))
			.use(cors())
			.use(bodyParser.urlencoded({extended: true}))
			.use(bodyParser.json({type: 'application/vnd.api+json'}))
	}

	return args.app
}

/**
 * Set up default routes for testing purposes
 */
function getRoutes(args) {
	if (!args.routes) {
		return path.join(__dirname, 'routes')
	}

	return args.routes
}

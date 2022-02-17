import buildApp from './api/build-app'
import buildKnexConfiguration from './configuration/knex-config'
import { logger } from './configuration/logger'
import { configureResolver } from './shared/configure-resolver'
import { Configuration } from './configuration'
import { configureTasks } from './tasks'

buildApp({
  fastify: {
    logger: { prettyPrint: Configuration.env !== 'production' },
  },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
})
  .then((app) => {
    configureTasks(app)
    return app.listen(Configuration.port, Configuration.host)
  })
  .catch((error) => {
    logger.error(error)
    throw error
  })

const config = require('../config/config');
const probeConfig = require(config.probeConfigFile);
const newman = require('newman');
const promClient = require('prom-client');
const logger = require('../utils/logger');

const NAME_PREFIX = 'probe_pm_';

class Prober {

  constructor(req, res, probe) {
    this.req = req;
    this.res = res;
    this.probe = probe;
    this.options = probeConfig[probe].options;

    // registry for the current probe
    this.probeRegistry = new promClient.Registry();
    if (typeof probeConfig[probe].customLabels === 'object') {
      this.probeRegistry.setDefaultLabels(probeConfig[probe].customLabels);
    }
  }

  run() {
    newman.run(this.options)
      .on('start', (err, args) => {
        logger.debug(`collection run for probe '${this.probe}' started`);
      })
      .on('done', async (err, summary) => {
        if (err || summary.error) {
          logger.error(`collection run for probe '${this.probe}' encountered an error`);
          this.summary = summary;
        }
        else {
          logger.debug(`collection run for probe '${this.probe}' completed`);
          if (this.req.query.debug === 'true') {
            if (config.enableProbeDebugging) {
              logger.info(`return /probe/${this.probe} with debug=true`);
              return this.res.send(summary.run);
            } else {
              logger.info(`rejected request to /probe/${this.probe} with debug=true. Probe debugging is disabled`);
              return this.res.status(403).send('probe debugging disabled');
            }
          }

          /**
           * set metrics
           */

          // probe success
          new promClient.Gauge({
            name: NAME_PREFIX + 'success',
            help: 'Returns the probe success',
            registers: [this.probeRegistry]
          }).set(summary.run.failures.length ? 0 : 1);

          // transfers
          new promClient.Gauge({
            name: NAME_PREFIX + 'transfers_response_bytes_total',
            help: 'Returns the transfers responseTotal',
            registers: [this.probeRegistry]
          }).set(summary.run.transfers.responseTotal);

          // stats
          for (const [key, value] of Object.entries(summary.run.stats)) {
            for (const [key2, value2] of Object.entries(value)) {
              logger.debug(`stats ${key} ${key2} ${value2}`);
              new promClient.Gauge({
                name: `${NAME_PREFIX}stats_${key}_${key2}`,
                help: `Returns the stats ${key} ${key2}`,
                registers: [this.probeRegistry]
              }).set(value2);
            }
          }

          // timings
          new promClient.Gauge({
            name: NAME_PREFIX + 'duration_seconds_total',
            help: 'Returns how long the run took to complete in seconds ((timings.completed - timings.started) / 1000)',
            registers: [this.probeRegistry]
          }).set((summary.run.timings.completed - summary.run.timings.started) / 1000);

          for (const [key, value] of Object.entries(summary.run.timings)) {
            logger.debug(`timings ${key} ${value}`);
            if (key === 'started') continue;
            if (key === 'completed') continue;
            new promClient.Gauge({
              name: `${NAME_PREFIX}timings_${key}_seconds`,
              help: `Returns the timings ${key} / 1000 (seconds)`,
              registers: [this.probeRegistry]
            }).set(value / 1000);
          }

          // executions
          for (const [key, execution] of Object.entries(summary.run.executions)) {
            // response time
            if (execution.response.responseTime) {
              var responseTimeGauge = new promClient.Gauge({
                name: NAME_PREFIX + 'executions_response_seconds',
                help: 'Returns response time (seconds)',
                registers: [this.probeRegistry],
                labelNames: ['iteration', 'position', 'request_name']
              }).set(
                {
                  'iteration': execution.cursor.iteration,
                  'position': execution.cursor.position,
                  'request_name': execution.item.name
                },
                execution.response.responseTime / 1000);
            }

            // response size
            if (execution.response.responseSize) {
              var responseTimeGauge = new promClient.Gauge({
                name: NAME_PREFIX + 'executions_response_bytes',
                help: 'Returns response size (bytes)',
                registers: [this.probeRegistry],
                labelNames: ['iteration', 'position', 'request_name']
              }).set(
                {
                  'iteration': execution.cursor.iteration,
                  'position': execution.cursor.position,
                  'request_name': execution.item.name
                },
                execution.response.responseSize);
            }

            // assertions
            if (execution.assertions) {
              var assertionFailureGauge = new promClient.Gauge({
                name: NAME_PREFIX + 'executions_assertion_failure',
                help: 'Returns assertion failures',
                registers: [this.probeRegistry],
                labelNames: ['iteration', 'position', 'request_name', 'assertion', 'skipped']
              });
              for (const [key2, assertion] of Object.entries(execution.assertions)) {
                assertionFailureGauge.set(
                  {
                    'iteration': execution.cursor.iteration,
                    'position': execution.cursor.position,
                    'request_name': execution.item.name,
                    'assertion': assertion.assertion,
                    'skipped': assertion.skipped
                  }, 
                  assertion.error !== undefined ? 1 : 0
                );
              }
            };
          }
          // ToDo:
          // loop over sumary.run.executions and add with labels?
          // * Request name
          // * HTTP Method
          // * URL (Creates lots of labels!, maybe without query parameters and otherwise shortened)
          // * Response code
          // * Response data received
          // * Response time

          // failures
          new promClient.Gauge({
            name: NAME_PREFIX + 'failures_total',
            help: 'Returns the total failure count',
            registers: [this.probeRegistry]
          }).set(summary.run.failures.length);

          logger.info(`return /probe/${this.probe}`);
          this.res.set('Content-Type', this.probeRegistry.contentType);
          this.res.send(await this.probeRegistry.metrics());
        }
      });
  }
  
}

module.exports = Prober;
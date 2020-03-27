const newman = require('newman');
const promClient = require('prom-client');

const NAME_PREFIX = 'probe_pm_';

class Prober {

  constructor(req, res, options) {
    console.log(`Running prober with probe "${req.params.probe}" and args: ${JSON.stringify(req.query)}`);
    this.req = req;
    this.res = res;
    this.options = options;

    // registry for the current probe
    this.probeRegistry = new promClient.Registry();
  }

  run() {
    newman.run(this.options)
      .on('start', (err, args) => {
        console.log('running a collection...');
      })
      .on('done', (err, summary) => {
        if (err || summary.error) {
          console.error('collection run encountered an error.');
          this.summary = summary;
        }
        else {
          console.log('collection run completed.');
          if (this.req.query.debug === 'true') return this.res.send(summary.run);

          /**
           * set metrics
           */

          // probe success
          if (summary.run.failures.length) {
            new promClient.Gauge({
              name: NAME_PREFIX + 'success',
              help: 'Returns the probe success',
              registers: [this.probeRegistry]
            }).set(0);
          } else {
            new promClient.Gauge({
              name: NAME_PREFIX + 'success',
              help: 'Returns the probe success',
              registers: [this.probeRegistry]
            }).set(1);
          }

          // transfers
          new promClient.Gauge({
            name: NAME_PREFIX + 'transfers_response_bytes_total',
            help: 'Returns the transfers responseTotal',
            registers: [this.probeRegistry]
          }).set(summary.run.transfers.responseTotal);

          // stats
          for (const [key, value] of Object.entries(summary.run.stats)) {
            for (const [key2, value2] of Object.entries(value)) {
              console.log('stats', key, key2, value2);
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
            console.log('timings', key, value);
            if (key === 'started') continue;
            if (key === 'completed') continue;
            new promClient.Gauge({
              name: `${NAME_PREFIX}timings_${key}_seconds`,
              help: `Returns the timings ${key} / 1000 (seconds)`,
              registers: [this.probeRegistry]
            }).set(value / 1000);
          }

          // failures
          new promClient.Gauge({
            name: NAME_PREFIX + 'failures_total',
            help: 'Returns the total failure count',
            registers: [this.probeRegistry]
          }).set(summary.run.failures.length);
          
          // ToDo:
          // loop over sumary.run.executions and add with labels?
          // * Request name
          // * HTTP Method
          // * URL (Creates lots of labels!, maybe without query parameters and otherwise shortened)
          // * Response code
          // * Response data received
          // * Response time
          // loop also over assertions?

          this.res.send(this.probeRegistry.metrics());
        }
      });
  }
  
}

module.exports = Prober;
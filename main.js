const config = require('./config/config');
const probeConfig = require(config.probeConfigFile);
const promClient = require('prom-client');
const express = require('express');
const logger = require('./utils/logger');
const Prober = require('./prober/prober');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const app = express();

/**
 * Show index page
 */
app.get('/', (req, res) => {
  logger.debug('return /');

  let probes = '';
  
  Object.keys(probeConfig).forEach(probe => {
    probes += `
      <p><a href="probe/${probe}">Probe "${probe}"</a></p>
      <p><a href="probe/${probe}?debug=true">Debug probe "${probe}"</a></p>`;
  });

  res.send(`<html>
  <head><title>Postman Exporter</title></head>
  <body>
    <h1>Postman Exporter</h1>
    <p><a href="metrics">Metrics</a></p>
    <p><a href="config">Configuration</a></p>
    <h2>Probes</h2>
    ${probes}
  </body>
</html>`);
});

/**
 * Run a probe
 */
app.get('/probe/:probe', (req, res) => {
  try {
    return new Prober(req, res, req.params.probe).run();
  }
  catch {
    logger.info(`requested probe '${req.params.probe}' not found`);
    return res.status(404).send('Probe not found');
  }
});

/**
 * Return Node.js metrics
 */
app.get('/metrics', (req, res) => {
  logger.debug('return /metrics');
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

/**
 * Return current configuration
 */
app.get('/config', (req, res) => {
  logger.debug('return /config');
  res.send(config);
});

/**
 * Returns status code 200 when the service is running
 */
app.get('/-/ready', (req, res) => {
  logger.debug('return /-/ready');
  res.send('ready');
});

app.listen(config.serverPort, () => logger.info(`postman exporter running on port ${config.serverPort}`));

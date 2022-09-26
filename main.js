const config = require('./config/config');
const probeConfig = require(config.probeConfigFile);
const promClient = require('prom-client');
const express = require('express');
const logger = require('./utils/logger');
const Prober = require('./prober/prober');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const app = express();
const path = require('path');

/**
 * Show index page
 */
app.get('/', (req, res) => {
  logger.debug('return /');

  let probes = '';
  
  Object.keys(probeConfig).forEach(probe => {
    if (probeConfig[probe].options.hasOwnProperty('reporter')) {
      if (probeConfig[probe].options.reporter.hasOwnProperty('htmlextra')) {
        probes += `
          <li><a href="probe/${probe}">${probe}</a> (<a href="htmlreport/${probe}">HTML report</a>)</li>`;
      } else {
        probes += `
          <li><a href="probe/${probe}">${probe}</a></li>`;
      }
    } else {
      probes += `
        <li><a href="probe/${probe}">${probe}</a></li>`;
    }
  });

  res.send(`<html>
  <head><title>Postman Exporter</title></head>
  <body>
    <h1>Postman Exporter</h1>
    <p><a href="metrics">Metrics</a></p>
    <p><a href="config">Configuration</a></p>
    <h2>Probes</h2>
    <ul>
    ${probes}
    </ul>
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
app.get('/metrics', async (req, res) => {
  logger.debug('return /metrics');
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
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

/**
 * Returns HTML report if used
 */
 app.get('/htmlreport/:probe', (req, res) => {
  try {
    logger.debug(`return /htmlreport/'${req.params.probe}'`);
    let htmlFile = probeConfig[req.params.probe].options.reporter.htmlextra.export;
    res.sendFile(path.join(__dirname, htmlFile));
  }
  catch {
    logger.info(`requested probe '${req.params.probe}' or html report not found`);
    return res.status(404).send('HTML report not found');
  }
});

const server = app.listen(config.serverPort, () => logger.info(`postman exporter running on port ${config.serverPort}`));
server.timeout = config.serverTimeout;

// Export for testing purposes
module.exports = app;

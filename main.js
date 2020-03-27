const config = require('./config/config');
const promClient = require('prom-client');
const express = require('express');
const Prober = require('./prober/prober');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const app = express();

/**
 * Show index page
 */
app.get('/', (req, res) => {

  let probes = '';
  
  Object.keys(config.probes).forEach(probe => {
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
    options = config.probes[req.params.probe].options;
  }
  catch {
    return res.status(404).send('Probe not found');
  }
  return new Prober(req, res, options).run();
});

/**
 * Return Node.js metrics
 */
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

/**
 * Return current configuration
 */
app.get('/config', (req, res) => {
  if (!config.enableConfigEndpoint === true) {
    return res.status(403).send('configuration endpoint disabled');
  }
  res.send(config);
});

/**
 * Returns 200 when the service is running
 */
app.get('/-/ready', (req, res) => {
  res.send('ready');
});

app.listen(config.serverPort, () => console.log(`postman exporter running on port ${config.serverPort}`));

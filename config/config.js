module.exports = {
  serverPort: process.env.POSTMAN_BLACKBOX_EXPORTER_PORT || 3000,
  logLevel: process.env.POSTMAN_BLACKBOX_EXPORTER_LOGLEVEL || 'info',
  enableConfigEndpoint: true, // configuration may expose secrets!
  probeConfigFile: process.env.POSTMAN_BLACKBOX_EXPORTER_PROBE_CONFIG_FILE || __dirname + '/' + 'probes.js',
};

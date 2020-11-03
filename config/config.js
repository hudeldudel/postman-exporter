module.exports = {
  serverPort: process.env.POSTMAN_BLACKBOX_EXPORTER_PORT || 3000,
  logLevel: process.env.POSTMAN_BLACKBOX_EXPORTER_LOGLEVEL || 'info',
  probeConfigFile: process.env.POSTMAN_BLACKBOX_EXPORTER_PROBE_CONFIG_FILE || __dirname + '/' + 'probes.js',
  enableProbeDebugging: process.env.POSTMAN_BLACKBOX_PROBE_DEBUGGING || false, // debug output may expose secrets!
};

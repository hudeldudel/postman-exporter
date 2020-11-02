// ToDo: read from yaml config file?
module.exports = {
  serverPort: process.env.POSTMAN_BLACKBOX_EXPORTER_PORT || 3000,
  logLevel: process.env.POSTMAN_BLACKBOX_EXPORTER_LOGLEVEL || 'info',
  enableConfigEndpoint: true, // configuration may expose secrets!
  probes: {
    "example": {
      options: {
        collection: require('./example.json')
      }
    }
  }
};

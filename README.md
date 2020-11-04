# Postman Exporter

The postman exporter allows blackbox probing with [Prometheus](https://prometheus.io/) using [Postman](https://www.postman.com/) collections.

## Motivation

There are several exporters available for collecting metrics with Prometheus. Most of it focus on providing whitebox metrics. The Prometheus [blackbox exporter](https://github.com/prometheus/blackbox_exporter) already allows probing of endpoints over HTTP, HTTPS, DNS, TCP and ICMP. However, it is complex or sometimes impossible to probe more sophisticated sequences of HTTP/HTTPS requests and validate its responses.

The postman exporter aims to be able to carry even complex test procedures. These should be easy to create with the widely used *Postman Platform for API Development*. It uses [Newman](https://github.com/postmanlabs/newman) (as library) to run Postman collections and provides metrics about that execution.

## Getting Started

Prerequisites:

* [Node.js](https://nodejs.org/) >= v10

Install: 

* GIT clone the project or [download the latest release](https://github.com/hudeldudel/postman-exporter/releases)
* Run `npm i` in the project folder to install required dependencies

Run: 

* Run `npm start` in the project folder to start the service.  
By default it will listen on port 3000.

## Configuration

The configuration consists of two parts.

1. Setup the exporter
2. Setup Prometheus to scrape postman exporter targets 

### Postman Exporter Configuration

**Probe configuration**

Edit the configuration file [config/probes.js](config/probes.js) to fit to your needs.

A Postman collection and associated options are combined to form a *probe*. Several probes can be configured to make them available via the `/probes` endpoint.

See also *[newman run options](https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter)* for details on the options available.

Example:

```javascript
module.exports = {
  // Each probe requires a Postman collection and allows for additional options. 
  // Execute by requesting /probe/<probe_name>

  // Probe name
  // <probe_name>
  // String of non-registered URL characters (A–Z, a–z, 0-9, -._~)
  "example": {

      // see newman documentation for all available parameters
      // https://github.com/postmanlabs/newman#newmanrunoptions-object--callback-function--run-eventemitter
      options: {
          collection: require('./example.json')
      }
  },

  "example2": {
      options: {
          collection: require('./eample2-collection.json'),
          environment: require('./example2-environment.json'),
          sslClientCert: __dirname + '/' + 'cert.pem',
          sslClientKey: __dirname + '/' + 'key.pem',
          timeoutRequest: 2000,
          folder: 'myFolder'
      }
  }
};
```


**Service configuration**

Service configuration is available via configuration file [config/config.js](config/config.js) or environment variables:

* `POSTMAN_BLACKBOX_EXPORTER_PORT`\
Network port to bind to.\
Default: *3000*
* `POSTMAN_BLACKBOX_EXPORTER_LOGLEVEL`\
Loglevel (*debug*|*info*|*warn*|*error*).\
Default: *info*
* `POSTMAN_BLACKBOX_EXPORTER_PROBE_CONFIG_FILE`\
Path to probe configuration file.\
Default: *config/probes.js*
* `POSTMAN_BLACKBOX_EXPORTER_PROBE_DEBUG`\
Allow/disallow (*true*|*false*) probe debug mode.\
**!** Debug output may expose secrets contained in requests/responses, etc.. **!**\
Default: *false*

### Prometheus Configuration

To scrape the probes, follow the [multi-target exporter pattern](https://prometheus.io/docs/guides/multi-target-exporter/) and use relabeling.

Example:

```yaml
scrape_configs:
  - job_name: 'postman-exporter'
    scrape_interval: 1m
    scrape_timeout: 10s
    scheme: http
    metrics_path: /probe
    static_configs:
    - targets:
      - example
    relabel_configs:
    - source_labels: [__address__]
      target_label: probe
    - source_labels: [__metrics_path__,__address__]
      separator: '/'
      target_label: __metrics_path__
    - target_label: __address__
      replacement: monitoring-postman-exporter
```

## Endpoints

* `GET /`\
Display overview page

* `GET /probe/:probe[?debug=true]`\
Run probe and show metrics\
*Parameters*:\
`probe`: (required) the probe to run. E. g. /probe/example\
*Arguments*:\
`?debug=true`: (optional) If added, newmans [run summary object](https://github.com/postmanlabs/newman#newmanruncallbackerror-object--summary-object) is returned instead of metrics. Probe debug also needs to be enabled in configuration.

* `GET /config`\
Show active configuration

* `GET /metrics`\
Node.js server metrics

* `GET /-/ready`\
Returns status code 200 when the service is running


## Metrics

* probe_pm_success: overall probe success (no failures for collection run)
* Values from https://github.com/postmanlabs/newman#newmanruncallbackerror-object--summary-object
  * summary.run.transfers.responseTotal
  * summary.run.stats.*
  * summary.run.timings.*
  * probe_pm_assertion_failure: assertion failures with iteration, position, request_name, assertion labels
  * Number of summary.run.failures

## Example Grafana Dashboard

tbd


# Postman Exporter

The postman exporter allows blackbox probing with [Prometheus](https://prometheus.io/) using [Postman](https://www.postman.com/) collections.

## Motivation

There are several exporters available for collecting metrics with Prometheus. Most of it focus on providing whitebox metrics. The Prometheus [blackbox exporter](https://github.com/prometheus/blackbox_exporter) already allows probing of endpoints over HTTP, HTTPS, DNS, TCP and ICMP. However, it is complex or sometimes impossible to probe more sophisticated sequences of HTTP/HTTPS requests and validate its responses.

The postman exporter aims to be able to carry even complex test procedures. These should be easy to create with the widely used *Postman Platform for API Development*. It uses [Newman](https://github.com/postmanlabs/newman) (as library) to run Postman collections and provides metrics about that execution.

## Getting Started

Prerequisites:

* [Node.js](https://nodejs.org/)  
  tested with v10.18.1

Install: 

* Checkout the project
* Run `npm i` to install required dependencies

Run: 

* Run `npm start` to start the service.  
By default it will listen on port 3000.

## Configuration

The configuration consists of two parts.

1. Setup the exporter
2. Setup Prometheus to scrape postman exporter targets 

### Postman Exporter Configuration

Edit the configuration file [config/config.js](config/config.js) to fit to your needs.

Example:

```javascript

module.exports = {
    // The network port to bind to
    serverPort: process.env.POSTMAN_EXPORTER_PORT || 3000,

    // Enable the /config endpoint. 
    // false if omitted
    // Warning: the configuration may contain secrets included in 
    //  collections, environments, etc. 
    enableConfigEndpoint: true,

    // A probe requires a Postman collection and allows for additional options. 
    // Execute by requesting /probe/<probe_name>
    probes: {

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
    }
};
```

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
      - demo
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

`GET /`
Display overview page

`GET /probe/:probe`
Run probe and show metrics
Parameters:
`probe`: the probe to run. E. g. /probe/example

`GET /config`
Show active configuration

`GET /metrics`
Node.js server metrics

`GET /-/ready`
Returns 200 when the service is running


## Metrics

* probe success
* Values from https://github.com/postmanlabs/newman#newmanruncallbackerror-object--summary-object
  * summary.run.transfers.responseTotal
  * summary.run.stats.*
  * summary.run.timings.*
  * Number of summary.run.failures

## Example Grafana Dashboard

tbd


const { expect } = require('chai');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../main.js');

// turn of logging during tests
const logger = require('../utils/logger');
logger.transports.forEach((t) => (t.silent = true));

chai.use(chaiHttp);
chai.should();

describe('Endpoint tests', () => {
    describe('GET /', () => {
        it('should return index page', (done) => {
            chai.request(app)
                .get('/')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.html;
                    res.text.should.have.string("Postman Exporter");
                    done();
                })
        })
    });
    describe('GET /config', () => {
        it('should return config json', (done) => {
            chai.request(app)
                .get('/config')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.have.property('serverPort');
                    expect(res.body.serverPort).to.be.a('number');
                    res.body.should.have.property('logLevel');
                    expect(res.body.logLevel).to.be.a('string')
                        .and.to.be.oneOf(['debug','info','warn','error']);
                    res.body.should.have.property('probeConfigFile');
                    expect(res.body.probeConfigFile).to.be.a('string');
                    res.body.should.have.property('enableProbeDebugging');
                    expect(res.body.enableProbeDebugging).to.be.a('boolean');
                    done();
                })
        })
    });
    describe('GET /metrics', () => {
        it('should return node metrics', (done) => {
            chai.request(app)
                .get('/metrics')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.text.should.have.string('nodejs_version_info');
                    done();
                })
        })
    });
    describe('GET /-/ready', () => {
        it('should return with http code 200', (done) => {
            chai.request(app)
                .get('/-/ready')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                })
        })
    });
    describe('GET /probe/example', () => {
        it('should return probe metrics', (done) => {
            chai.request(app)
                .get('/probe/example')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.html;
                    res.text.should.have.string('probe_pm_success');
                    done();
                })
        })
        .slow(2000)
        .timeout(5000)

    });
});

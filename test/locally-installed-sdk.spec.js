'use strict';

const chai = require('chai');
const { Datastore } = require('@google-cloud/datastore');
const Emulator = require('../index');
const fse = require('fs-extra');
const nodeCleanup = require('node-cleanup');
const path = require('path');

chai.use(require("chai-as-promised"));

const testUtil = require('./test-util');

const expect = chai.expect;
const testData = {
  testProp: 'test-data'
};

describe('Locally Installed Google DataStore Emulator Test', () => {
  const emulatorDir = './emulator-test3';

  before((done) => {
    process.env.CLOUDSDK_CORE_PROJECT = 'test';

    if (testUtil.directoryExists(emulatorDir))
      fse.remove(emulatorDir, (err) => {
        return done(err);
      });
    else {
      done()
    }
  });

  beforeEach(() => {
    process.env.GCLOUD_PROJECT = null;
  });

  afterEach(() => {
    process.env.GCLOUD_PROJECT = null;
  });

  it('should start the emulator with env.GCLOUD_PROJECT', () => {
    process.env.GCLOUD_PROJECT = 'test';

    let entityKey;

    let options = {
      debug: true
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {
        const datastore = new Datastore();
        entityKey = datastore.key({ namespace: 'test-ns', path: ['test-path'] });
        const testEntity = {
          key: entityKey,
          data: testData
        };

        return datastore.save(testEntity);
      })
      .then(() => {
        const datastore = new Datastore();

        return datastore.get(entityKey);
      })
      .then((result) => {
        expect(result.length).to.be.equal(1);
        const entity = result[0];
        expect(entity).to.be.deep.equal(testData);
      })
      .then(() => {
        return emulator.stop();
      })
  });

  it('should not write to console if debug=false', () => {
    process.env.GCLOUD_PROJECT = 'test';
    let wroteDataStore = false;
    const originalConsoleLog = console.log;
    console.log = function (d) {
      process.stdout.write(d + '\n');

      if (!d  || !d.indexOf)
        return;

      if (d.indexOf('[datastore]') > -1) {
        wroteDataStore = true;
      }
    };

    let options = {
      debug: false
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {
        return emulator.stop();
      })
      .then(() => {
        console.log = originalConsoleLog;
        expect(wroteDataStore).to.be.equal(false);
        process.env.GCLOUD_PROJECT = null;
      })

  });

  it('should start the emulator when set project Id', () => {
    const projectId = 'test2';
    let entityKey;

    let options = {
      debug: true,
      project: projectId
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {
        const datastore = new Datastore({
          projectId
        });
        entityKey = datastore.key({ namespace: 'test-ns', path: ['test-path'] });
        const testEntity = {
          key: entityKey,
          data: testData
        };

        return datastore.save(testEntity);
      })
      .then(() => {
        const datastore = new Datastore({
          projectId
        });

        return datastore.get(entityKey);
      })
      .then((result) => {
        expect(result.length).to.be.equal(1);
        const entity = result[0];
        expect(entity).to.be.deep.equal(testData);

        return Promise.resolve();
      })
      .then(() => {
        return emulator.stop();
      })
  });

  it('should start the emulator when set project Id and dataDir', () => {
    const projectId = 'test3';
    const dataDir = emulatorDir;

    expect(testUtil.directoryExists(dataDir)).to.be.equal(false);

    let entityKey;

    let options = {
      debug: true,
      project: projectId,
      dataDir
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {
        let file = path.join(dataDir, 'env.yaml');
        expect(testUtil.fileExists(file)).to.be.equal(true);

        const datastore = new Datastore({
          projectId
        });
        entityKey = datastore.key({ namespace: 'test-ns', path: ['test-path'] });
        const testEntity = {
          key: entityKey,
          data: testData
        };

        return datastore.save(testEntity);
      })
      .then(() => {
        const datastore = new Datastore({
          projectId
        });

        return datastore.get(entityKey);
      })
      .then((result) => {
        expect(result.length).to.be.equal(1);
        const entity = result[0];
        expect(entity).to.be.deep.equal(testData);

        return Promise.resolve();
      })
      .then(() => {
        return emulator.stop();
      })
      .then(() => {
        expect(testUtil.directoryExists(dataDir)).to.be.equal(false);
      })
  });

  it('should start the emulator with specified host and port', () => {
    process.env.GCLOUD_PROJECT = 'test';
    let entityKey;

    let options = {
      debug: true,
      host: 'localhost',
      port: 8555
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {

        expect(process.env.DATASTORE_EMULATOR_HOST).to.be.equal(`${options.host}:${options.port}`);
        const datastore = new Datastore();
        entityKey = datastore.key({ namespace: 'test-ns', path: ['test-path'] });
        const testEntity = {
          key: entityKey,
          data: testData
        };

        return datastore.save(testEntity);
      })
      .then(() => {
        const datastore = new Datastore();

        return datastore.get(entityKey);
      })
      .then((result) => {
        return emulator.stop()
          .then(() => {
            expect(result.length).to.be.equal(1);
            const entity = result[0];
            expect(entity).to.be.deep.equal(testData);
          })
      })
  });

  it('should start the emulator on localhost when specified only port', () => {
    process.env.GCLOUD_PROJECT = 'test';
    let entityKey;

    let options = {
      debug: true,
      port: 8555
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {

        expect(process.env.DATASTORE_EMULATOR_HOST).to.be.equal(`localhost:${options.port}`);
        const datastore = new Datastore();
        entityKey = datastore.key({ namespace: 'test-ns', path: ['test-path'] });
        const testEntity = {
          key: entityKey,
          data: testData
        };

        return datastore.save(testEntity);
      })
      .then(() => {
        const datastore = new Datastore();

        return datastore.get(entityKey);
      })
      .then((result) => {
        return emulator.stop()
          .then(() => {
            expect(result.length).to.be.equal(1);
            const entity = result[0];
            expect(entity).to.be.deep.equal(testData);

          });
      })
  });

  it('should set environment variables', () => {
    process.env.GCLOUD_PROJECT = 'my-test-GCLOUD_PROJECT';
    let options = {
      debug: true,
      port: 8081,
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {
        expect(process.env.DATASTORE_EMULATOR_HOST).to.be.equal(`localhost:8081`);
        expect(process.env.DATASTORE_EMULATOR_HOST_PATH).to.be.equal(`localhost:8081/datastore`);
        expect(process.env.DATASTORE_HOST).to.be.equal(`http://localhost:8081`);
        // shouldn't this be the same as GCLOUD_PROJECT, but they don't
        // see: https://gist.github.com/mdornseif/d9bd0c55a7aab298d0a29bee124302c8
        expect(process.env.DATASTORE_DATASET).to.be.equal(`test`);
        expect(process.env.DATASTORE_PROJECT_ID).to.be.equal(`test`);
        // These should not fail, but they do
        // expect(process.env.DATASTORE_DATASET).to.be.equal(`my-test-GCLOUD_PROJECT`);
        // expect(process.env.DATASTORE_PROJECT_ID).to.be.equal(`my-test-GCLOUD_PROJECT`);
      })
      .then((result) => {
        return emulator.stop()
      })
  });

  it('should not start twice', () => {
    process.env.GCLOUD_PROJECT = 'test';

    let options = {
      debug: true
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(() => {
        return expect(emulator.start()).to.rejected;
      })
      .then((error) => {
        return emulator.stop().then(() => {
          expect(error).to.have.property('message', 'Datastore emulator is already running.');
        });
      })
  });

  it('should return ok when call stop twice', () => {
    process.env.GCLOUD_PROJECT = 'test';

    let options = {
      debug: true
    };

    let emulator = new Emulator(options);

    return emulator.start()
      .then(emulator.stop.bind(emulator))
      .then(emulator.stop.bind(emulator));
  });

  it.skip('process.exit should kill child processes', function (done) {

    process.env.GCLOUD_PROJECT = 'test';

    let options = {
      debug: true
    };

    let emulator = new Emulator(options);
    let calledDone = false;

    emulator.start()
      .then(() => {
        nodeCleanup(() => {
          if (!calledDone) {
            calledDone = true;
            setTimeout(done, 2000);
          }
        });

        process.kill(process.pid);
      })
  });

  it('should start after stop', async () => {
    const options = {
      debug: true
    };
    const emulator = new Emulator(options);

    try {
      await emulator.start();
      await emulator.stop();
      await emulator.start();
    } catch (error) {
      console.error('start-stop-start error:', error);
      expect(error).to.not.be.ok;
    } finally {
      await emulator.stop();
    }
  })
});

describe('Consistency test', () => {
  // Each test suite needs to have a unique folder.
  let emulator;
  let ds;

  before(() => {
    const options = {
      consistency: 1.0,
      port: 8082
    };
    emulator = new Emulator(options);
    return emulator.start()
      .then(() => {
        // console.log('Emulator ready. Host: ', process.env.DATASTORE_EMULATOR_HOST);
        ds = new Datastore({
          keyFilename: {},
          projectId: 'test'
        });
        return true;
      })
  });

  after(() => {
    return emulator.stop();
  });

  describe('Test save', () => {
    it.skip('Save promise should reject', () => {
      const key = ds.key(['TestData1']);
      const data = {
        title: 'Test1'
      };

      return expect(ds.save({
        key: key,
        data: data
      })).to.be.rejected;
    });

    it('Save promise should resolve', () => {
      const key = ds.key(['TestData2']);
      const data = {
        title: 'Test2'
      };

      return expect(ds.save({
        key: key,
        data: data
      })).to.be.fulfilled;
    });
  });
});

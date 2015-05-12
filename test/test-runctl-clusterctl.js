var helper = require('./helper');
var tap = require('tap');

var rc = helper.runCtl;
var supervise = rc.supervise;
var expect = rc.expect;
var waiton = rc.waiton;

var APP = require.resolve('./module-app');

process.env.SL_RUN_SKIP_IPCCTL =
  'We have to disable ipcctl in master because its parent is a bunch of' +
  ' synchronous tests, which means the parent never reads from the IPC' +
  ' channel node has set up for us. And since it never drains the buffer' +
  ' it eventually fills up and process.send() becomes blocking. So now' +
  ' the supervisor cluster master is blocked which basically causes' +
  ' everything to go to hell. Now someone owes me a cider because I spent' +
  ' a whole afternoon trying to figure out why this test started hanging' +
  ' on the last command if I added more than 3 bytes to the status message.';

tap.test('runctl via clusterctl', function(t) {
  var run = supervise(APP);

  // supervisor should exit with 0 after we stop it
  run.on('exit', function(code, signal) {
    t.equal(code, 0, 'supervisor exits with 0');
    t.end();
  });

  t.doesNotThrow(function() {
    cd(path.dirname(APP));
  });

  t.doesNotThrow(function() {
    waiton('', /worker count: 0/);
  });

  t.doesNotThrow(function() {
    expect('set-size 1');
  });

  t.doesNotThrow(function() {
    waiton('status', /worker count: 1/);
  });

  t.doesNotThrow(function() {
    expect('status', /worker id 1:/);
  });

  t.doesNotThrow(function() {
    expect('set-size 2');
  });

  t.doesNotThrow(function() {
    waiton('status', /worker count: 2/);
  });

  t.doesNotThrow(function() {
    expect('status', /worker id 2:/);
  });

  t.doesNotThrow(function() {
    expect('restart');
  });

  t.doesNotThrow(function() {
    waiton('status', /worker id 4:/);
  });

  t.doesNotThrow(function() {
    expect('status', /worker count: 2/);
  });

  t.doesNotThrow(function() {
    expect('fork', /workerID: 5/);
  });

  t.doesNotThrow(function() {
    waiton('status', /worker count: 3/);
  });

  // cluster control kills off the extra worker
  t.doesNotThrow(function() {
    waiton('status', /worker count: 2/);
  });

  t.doesNotThrow(function() {
    expect('disconnect');
  });

  t.doesNotThrow(function() {
    waiton('status', /worker id 6:/);
  });

  t.doesNotThrow(function() {
    expect('status', /worker count: 2/);
  });

  t.doesNotThrow(function() {
    expect('stop');
  });
});

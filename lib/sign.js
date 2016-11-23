/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */
/*
 * This script is for signing the Min Vid add-on. If the current
 * package version has already been signed, we download the signed xpi
 * from amo, and move the files into the dist/ directory.
 * If the package version has not been signed, sign the xpi, and move
 * them into the /dist directory.
 *
 */

/* eslint-disable no-console */

const fs = require('fs');
const request = require('request');
const jwt = require('jsonwebtoken');
let signedOpts;

module.exports = function(opts, cb) {
  const authToken = jwt.sign({iss: opts.apiKey}, opts.apiSecret, {
    algorithm: 'HS256',
    expiresIn: 60
  });

  signedOpts = {
    url: 'https://addons.mozilla.org/api/v3/addons/' + opts.id + '/versions/' + opts.version + '/',
    headers: {'Authorization': 'JWT ' + authToken}
  };
  request(signedOpts, function(err, resp, body) {
    if (resp.statusCode === 401) {
      console.log('SIGNING UNAUTHORIZED: Please check your TESTPILOT_AMO_USER and TESTPILOT_AMO_SECRET');
      process.exit(1);
    }

    if (!err && resp.statusCode === 200) {
      const info = JSON.parse(body);
      if (info.files.length) {
        const ws = fs.createWriteStream('signed-addon.xpi').on('finish', removeGeneratedXpi);
        signedOpts.url = info.files[0].download_url;
        request(signedOpts).pipe(ws);
        cb();
      }
    } else distAddon(opts, cb);
  });
}

// if we need to sign and distribute our add-on, we want to use this method
function distAddon(opts, cb) {
  // sign our add-on
  const generatedXpi = 'addon.xpi';
  signAddon(generatedXpi, opts.apiKey, opts.apiSecret, function(err, signedXpiPath) {
    if (err) return cb(err);
    // remove our generated xpi since we now have a signed version
    removeGeneratedXpi();
    // move our signed xpi and rdf into the /dist dir
    // directory and exit
    checkExistsAndMv(signedXpiPath, 'signed-addon.xpi', function(err) {
      if (err) return cb(err);
      console.log('addon.xpi written to signed-addon.xpi');
      cb();
    });
  });
}

function removeGeneratedXpi() {
  const generatedXpi = 'addon.xpi';
  fs.unlink(generatedXpi, function(err) {
    if (err) console.error(err);
    else console.log('removed ' + generatedXpi + ' successfully');
  });
}

function signAddon(xpiPath, apiKey, apiSecret, cb) {
  require('jpm/lib/sign').sign({
    apiKey: apiKey,
    apiSecret: apiSecret,
    xpi: xpiPath
  }).then(function(result) {
    if (result.success) cb(null, result.downloadedFiles[0]);
    else cb(result);
  }).catch(cb);
}

function checkExistsAndMv(fromFilePath, toFilePath, cb) {
  fs.stat(fromFilePath, function(err) {
    if (err) return cb(err);
    fs.rename(fromFilePath, toFilePath, function(err) {
      if (err) return cb(err);
      else cb();
    });
  });
}

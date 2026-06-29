'use strict';

const Store = require('./reference-store');

function saveManifest(manifest) {
  return Store.storeManifest(manifest);
}

module.exports = {
  saveManifest,
};

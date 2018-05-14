const assert = require('assert')
const Nanobus = require('nanobus')
const window = require('global/window')

let id = 0

// Blob or file
function encrypt (key, nonce, blob, opts, cb) {
  const worker = new window.Worker('./encrypt-worker.js')
  const bus = new Nanobus('encrypt-' + id++)
  bus.worker = worker

  worker.onmessage = (ev) => {
    switch (ev.data.name) {
      default: {
        console.log(ev.data)
        cb()
      }
    }
  }

  worker.postMessage({name: 'FOO', msg: 'bar'})
  return bus
}

exports.encrypt = encrypt

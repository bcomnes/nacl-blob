const assert = require('assert')
const Nanobus = require('nanobus')

class NACLBlob {
  constructor (opts) {
    this.opts = Object.assign({
      chunkLength: 1024 * 1024 // 1 MB
    }, opts)
  }

  encrypt (key, nonce, blob, mimeType, cb) {
    const encryptedChunks = []
    let position = 0
    const emitter = new Nanobus()

    const worker = new Worker('./encrypt-worker.js')

    worker.onmessage = (ev) => {
      switch (event.data.name) {
        case 'ENCRYPT_START_OK': {
          return postNextChunk()
        }

        case 'ENCRYPT_CHUNK_OK': {
          encryptedChunks.push(event.data.encryptedChunks)
          emitter.emit('progress', {})
        }
      }
    }
  }

  decrypt (key, nonce, blob, mimeType, cb) {

  }
}

function encrypt (key, nonce, blob, mimeType, opts, cb) {
  assert(key, 'A key is required')
  assert(nonce, 'A nonce is required')
  assert(blob)
}

function decrypt (key, nonce, blob, mimeType, opts, cb) {

}

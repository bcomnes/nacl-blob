/* eslint-env browser  */
const nacl = require('nacl-stream')
const Nanobus = require('nanobus')

function encrypt (key, nonce, blob, opts, cb) {
  if (!opts) opts = {}
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = Object.assign({
    chunkSize: 1024 * 1024,
    mimeType: blob.type
  }, opts) // defaults
  const bus = new Nanobus()

  const encryptedChunks = []
  let position = 0

  const worker = new Worker('./encrypt-worker.js')

  worker.onmessage = function (ev) {
    switch (ev.data.name) {
      case 'ENCRYPT_START_OK': {
        return postNextChunk()
      }

      case 'ENCRYPT_CHUNK_OK': {
        encryptedChunks.push(ev.data.encryptedChunk)
        bus.emit('progress', position, blob.size)
        if (!ev.data.isLast) {
          return postNextChunk()
        }

        return worker.postMessage({
          name: 'ENCRYPT_FINISH'
        })
      }

      case 'ENCRYPT_FINISH_OK': {
        return cb(null, new Blob(encryptedChunks, {type: opts.mimeType}))
      }
      case 'ENCRYPT_CANCEL_OK': {
        return cb(ev.data.reason)
      }

      default: {
        throw new Error('received unknown message from worker ' + event.data.name)
      }
    }
  }

  function error (reason) {
    worker.postMessage({
      name: 'ENCRYPT_CANCEL',
      reason: reason
    })
  }

  // Reads blob slice contents as Uint8Array, passing it to callback.
  function readBlobSlice (blob, start, end, callback) {
    var reader = new FileReader() // XXX cache reader as the enclosed function's var?
    reader.onerror = function (ev) {
      error(ev) // TODO where is actual error string?
    }
    reader.onload = function () {
      callback(new Uint8Array(reader.result))
    }
    reader.readAsArrayBuffer(blob.slice(start, end))
  }

  // Feeds next chunk to worker and advances position.
  function postNextChunk () {
    var isLast = false
    var end = position + opts.chunkSize
    if (end >= blob.size) {
      end = blob.size
      isLast = true
    }
    readBlobSlice(blob, position, end, function (chunk) {
      worker.postMessage({
        name: 'ENCRYPT_CHUNK',
        chunk: chunk,
        isLast: isLast
      })
      // Advance position.
      position = end
    })
  }

  // Start encryption!
  worker.postMessage({
    name: 'ENCRYPT_START',
    key: key,
    nonce: nonce,
    maxChunkLength: opts.chunkSize
  })

  return bus
}

exports.encrypt = encrypt

function decrypt (key, nonce, blob, opts, cb) {
  if (!opts) opts = {}
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = Object.assign({
    chunkSize: 1024 * 1024,
    mimeType: blob.type
  }, opts) // defaults
  const bus = new Nanobus()

  const decryptedChunks = []
  let position = 0
  let nextChunkSize = -1

  const worker = new Worker('./decrypt-worker.js')

  worker.onmessage = function (ev) {
    switch (ev.data.name) {
      case 'DECRYPT_START_OK': {
        return postNextChunk()
      }

      case 'DECRYPT_CHUNK_OK': {
        if (!ev.data.decryptedChunk) {
          return error('decryption failed')
        }

        decryptedChunks.push(ev.data.decryptedChunk)

        bus.emit('progress', position, blob.size)

        if (!ev.data.isLast) {
          return postNextChunk()
        }

        return worker.postMessage({
          name: 'DECRYPT_FINISH'
        })
      }

      case 'DECRYPT_FINISH_OK': {
        return cb(null, new Blob(decryptedChunks), { type: opts.mimeType })
      }

      case 'DECRYPT_CANCEL_OK': {
        return cb(ev.data.reason)
      }

      default: {
        throw new Error('received unknown message from worker ' + ev.data.name)
      }
    }
  }

  // Cancel decryption with error.
  function error (reason) {
    worker.postMessage({
      name: 'DECRYPT_CANCEL',
      reason: reason
    })
  }

  // Reads blob slice contents as Uint8Array, passing it to callback.
  function readBlobSlice (blob, start, end, callback) {
    var reader = new FileReader() // XXX cache reader as the enclosed function's var?
    reader.onerror = function (event) {
      error(event) // XXX what's the actual error description?
    }
    reader.onload = function () {
      callback(new Uint8Array(reader.result))
    }
    reader.readAsArrayBuffer(blob.slice(start, end))
  }

  // Feeds next chunk to worker and advances position.
  function postNextChunk () {
    if (nextChunkSize === -1) {
      // We are just starting, so read first chunk length.
      if (position + 2 >= blob.size) {
        return error('blob is too short')
      }
      readBlobSlice(blob, position, position + 4, function (data) {
        nextChunkSize = nacl.stream.readChunkLength(data)
        position = 4
        // Now that we have chunk size, call ourselves again.
        postNextChunk()
      })
    } else {
      // Read next chunk + length of the following chunk after it.
      var isLast = false
      var end = position + nextChunkSize + 16 /* tag */ + 4 /* length */
      if (end >= blob.size) {
        end = blob.size
        isLast = true
      }
      readBlobSlice(blob, position - 4 /* include chunk length */, end, function (chunk) {
        if (!isLast) {
          // Read next chunk's length.
          nextChunkSize = nacl.stream.readChunkLength(chunk, chunk.length - 4)
          // Slice the length off.
          chunk = chunk.subarray(0, chunk.length - 4)
        } else {
          nextChunkSize = 0
        }
        // Decrypt.
        worker.postMessage({
          name: 'DECRYPT_CHUNK',
          chunk: chunk,
          isLast: isLast
        })
        // Advance position.
        position = end
      })
    }
  }

  // Start decryption!
  worker.postMessage({
    name: 'DECRYPT_START',
    key: key,
    nonce: nonce,
    maxChunkLength: opts.chunkSize
  })

  return bus
}

exports.decrypt = decrypt

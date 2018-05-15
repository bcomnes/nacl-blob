// const window = require('global/window')
// const assert = require('assert')
// const Nanobus = require('nanobus')
const filereaderStream = require('filereader-stream')
const concatStream = require('concat-stream')
const pump = require('pump')
const through = require('through2')
const nacl = require('nacl-stream')
const tou8 = require('buffer-to-uint8array')

// let id = 0
function encrypt (key, nonce, blob, opts, cb) {
  if (!opts) opts = {}
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = Object.assign({
    chunkSize: 1024 * 1024
  }, opts) // defaults

  // const bus = new Nanobus('encrypt-' + id++)
  const frs = filereaderStream(blob, { chunkSize: opts.chunkSize })
  const concat = concatStream(gotEncrypted)
  let encryptor = nacl.stream.createEncryptor(key, nonce, opts.chunkSize)

  let encrypted = null
  let buffer = null

  pump(frs, through(encrypt, finalizeEncrypt), concat, streamEnded)

  function encrypt (chunk, enc, cb) {
    chunk = tou8(chunk)
    const isFirstChunk = buffer === null
    if (isFirstChunk) {
      buffer = chunk
      return cb(null)
    } else {
      const bufferedChunk = buffer
      buffer = chunk
      let encryptedChunk
      try {
        encryptedChunk = encryptor.encryptChunk(bufferedChunk, false)
      } catch (e) {
        return cb(e)
      }
      return cb(null, encryptedChunk)
    }
  }

  function finalizeEncrypt (cb) {
    let endChunk
    try {
      endChunk = encryptor.encryptChunk(buffer, true)
      encryptor.clean()
      encryptor = null
    } catch (e) {
      return cb(e)
    }
    cb(null, endChunk)
  }

  function gotEncrypted (encryptedSomething) {
    encrypted = encryptedSomething
  }

  function streamEnded (err) {
    if (err) return cb(err)
    cb(null, encrypted)
  }

  // return bus
}

exports.encrypt = encrypt

function decrypt (key, nonce, blob, opts, cb) {
  if (!opts) opts = {}
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = Object.assign({
    chunkSize: 1024 * 1024
  }, opts) // defaults

  // const bus = new Nanobus('encrypt-' + id++)
  const frs = filereaderStream(blob, { chunkSize: opts.chunkSize })
  const concat = concatStream(gotEncrypted)
  let decryptor = nacl.stream.createDecryptor(key, nonce, opts.chunkSize)

  let decrypted = null
  let buffer

  pump(frs, through(decrypt, finalizeDecrypt), concat, streamEnded)

  function decrypt (chunk, enc, cb) {
    chunk = tou8(chunk)
    const isFirstChunk = buffer === null
    if (isFirstChunk) {
      buffer = chunk
      return cb(null)
    } else {
      const bufferedChunk = buffer
      buffer = chunk
      let decryptedChunk
      try {
        decryptedChunk = decryptor.decryptChunk(bufferedChunk, false)
      } catch (e) {
        return cb(e)
      }
      return cb(null, decryptedChunk)
    }
  }

  function finalizeDecrypt (cb) {
    let endChunk
    try {
      endChunk = decryptor.decryptChunk(new Uint8Array(buffer), true)
      decryptor.clean()
      decryptor = null
    } catch (e) {
      return cb(e)
    }
    cb(null, endChunk)
  }

  function gotEncrypted (decryptedSomething) {
    decrypted = decryptedSomething
  }

  function streamEnded (err) {
    if (err) return cb(err)
    cb(null, decrypted)
  }

  // return bus
}
exports.decrypt = decrypt

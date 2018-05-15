/* eslint-env worker */

const nacl = require('nacl-stream')

onmessage = function (ev) {
  switch (ev.data.name) {
    case 'ENCRYPT_START': {
      return startEncryption(ev.data.key, ev.data.nonce, ev.data.maxChunkLength)
    }

    case 'ENCRYPT_CHUNK': {
      return encryptChunk(ev.data.chunk, ev.data.isLast)
    }

    case 'ENCRYPT_FINISH': {
      return finishEncryption()
    }

    case 'ENCRYPT_CANCEL': {
      return cancelEncryption(ev.data.reason)
    }

    default: {
      throw new Error('worker received unknown message ' + ev.data.name)
    }
  }
}

let encryptor = null

function startEncryption (key, nonce, maxChunkLength) {
  encryptor = nacl.stream.createEncryptor(key, nonce, maxChunkLength)
  postMessage({
    name: 'ENCRYPT_START_OK'
  })
}

function encryptChunk (chunk, isLast) {
  var encryptedChunk = encryptor.encryptChunk(chunk, isLast)
  postMessage({
    name: 'ENCRYPT_CHUNK_OK',
    encryptedChunk: encryptedChunk,
    isLast: isLast
  })
}

function finishEncryption () {
  encryptor.clean()
  encryptor = null
  postMessage({
    name: 'ENCRYPT_FINISH_OK'
  })
}

function cancelEncryption (reason) {
  encryptor.clean()
  encryptor = null
  postMessage({
    name: 'ENCRYPT_CANCEL_OK',
    reason: reason
  })
}

/* eslint-env worker */

const nacl = require('nacl-stream')

onmessage = function (ev) {
  switch (ev.data.name) {
    case 'DECRYPT_START': {
      return startDecryption(ev.data.key, ev.data.nonce, ev.data.maxChunkLength)
    }

    case 'DECRYPT_CHUNK': {
      return decryptChunk(ev.data.chunk, ev.data.isLast)
    }

    case 'DECRYPT_FINISH': {
      return finishDecryption()
    }
    case 'DECRYPT_CANCEL': {
      return cancelDecryption(ev.data.reason)
    }

    default: {
      throw new Error('worker received unknown message ' + ev.data.name)
    }
  }
}

let decryptor = null

function startDecryption (key, nonce, maxChunkLength) {
  decryptor = nacl.stream.createDecryptor(key, nonce, maxChunkLength)
  postMessage({
    name: 'DECRYPT_START_OK'
  })
}

function decryptChunk (chunk, isLast) {
  var decryptedChunk = decryptor.decryptChunk(chunk, isLast)
  postMessage({
    name: 'DECRYPT_CHUNK_OK',
    decryptedChunk: decryptedChunk,
    isLast: isLast
  })
}

function finishDecryption () {
  decryptor.clean()
  decryptor = null
  postMessage({
    name: 'DECRYPT_FINISH_OK'
  })
}

function cancelDecryption (reason) {
  decryptor.clean()
  decryptor = null
  postMessage({
    name: 'DECRYPT_CANCEL_OK',
    reason: reason
  })
}

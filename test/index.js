/* eslint-env browser */
const test = require('tape')
const naclBlob = require('../index')

test('test stream', t => {
  var key = new Uint8Array(32)
  var nonce = new Uint8Array(16)
  // var arr = nacl.util.decodeUTF8('Hello, chunky!');
  var arr = new Uint8Array(10 * 1024 * 1024 + 111)
  for (var i = 0; i < arr.length; i++) arr[i] = i & 0xff
  var blob = new Blob([arr])
  const encryptor = naclBlob.encrypt(key, nonce, blob, (err, encryptedBlob) => {
    t.error(err)
    console.log(encryptedBlob)
    const decryptor = naclBlob.decrypt(key, nonce, encryptedBlob, (err, decryptedBlob) => {
      t.error(err)
      console.log(decryptedBlob)
      compareBlobs(blob, decryptedBlob)
      t.end()
    })
    decryptor.on('progress', (pos, len) => { console.log('decrypting ' + (pos / len) * 100) })
  })

  encryptor.on('progress', (pos, len) => { console.log('encrypting ' + (pos / len) * 100) })
})

function compareBlobs (a, b) {
  var r1 = new FileReader()
  r1.onload = function () {
    var r2 = new FileReader()
    r2.onload = function () {
      if (r1.result !== r2.result) {
        console.error('blobs differ')
      } else {
        console.log('blobs are equal')
      }
    }
    r2.readAsBinaryString(b)
  }
  r1.readAsBinaryString(a)
}

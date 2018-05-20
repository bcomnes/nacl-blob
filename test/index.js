/* eslint-env browser */
const test = require('tape')
const naclBlob = require('../index')

test('test encryption and decryption', t => {
  const key = new Uint8Array(32)
  const nonce = new Uint8Array(16)
  // var arr = nacl.util.decodeUTF8('Hello, chunky!');
  const arr = new Uint8Array(10 * 1024 * 1024 + 111)
  for (let i = 0; i < arr.length; i++) arr[i] = i & 0xff
  const blob = new Blob([arr])
  const encryptor = naclBlob.encrypt(key, nonce, blob, (err, encryptedBlob) => {
    t.error(err)
    const decryptor = naclBlob.decrypt(key, nonce, encryptedBlob, (err, decryptedBlob) => {
      t.error(err)
      compareBlobs(blob, decryptedBlob)
      t.end()
    })
    decryptor.on('progress', ({position, length}) => { console.log('decrypting %' + (position / length) * 100) })
  })

  encryptor.on('progress', ({position, length}) => { console.log('encrypting %' + (position / length) * 100) })
})

function compareBlobs (a, b) {
  const r1 = new FileReader()
  r1.onload = function () {
    const r2 = new FileReader()
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

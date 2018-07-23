/* eslint-env browser */
const test = require('tape')
const naclBlob = require('./index')
const nacl = require('tweetnacl')

test('test encryption and decryption', t => {
  const key = nacl.box.keyPair().secretKey
  const nonce = nacl.randomBytes(16)

  const arr = new Uint8Array(10 * 1024 * 1024 + 500)
  for (let i = 0; i < arr.length; i++) arr[i] = i & 0xff
  const blob = new Blob([arr])

  let encryptorProgressRan = false
  let decryptorProgressRan = false

  const encryptor = naclBlob.encrypt(key, nonce, blob, (err, encryptedBlob) => {
    t.error(err, 'encrypt without error')
    const decryptor = naclBlob.decrypt(key, nonce, encryptedBlob, (err, decryptedBlob) => {
      t.error(err, 'decrypt without error')

      t.ok(encryptorProgressRan, 'encryptor event emitter was running')
      t.ok(decryptorProgressRan, 'decryptor event emitter was running')

      compareBlobs(blob, decryptedBlob, (err) => {
        t.error(err, 'original blob equals decrypted blob')
        t.end()
      })
    })
    decryptor.on('progress', ({position, length}) => {
      decryptorProgressRan = true
      console.log('decrypting %' + Math.floor((position / length) * 100))
    })
  })

  encryptor.on('progress', ({position, length}) => {
    encryptorProgressRan = true
    console.log('encrypting %' + Math.floor((position / length) * 100))
  })
})

function compareBlobs (a, b, cb) {
  const r1 = new FileReader()
  r1.onload = function () {
    const r2 = new FileReader()
    r2.onload = function () {
      if (r1.result !== r2.result) {
        cb(new Error('blobs are not equal'))
      } else {
        cb(null)
      }
    }
    r2.readAsBinaryString(b)
  }
  r1.readAsBinaryString(a)
}

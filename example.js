/* eslint-env browser */
const naclBlob = require('./index')
const nacl = require('tweetnacl')

const key = nacl.box.keyPair().secretKey
const nonce = nacl.randomBytes(16)

const arr = new Uint8Array(10 * 1024 * 1024 + 111)
for (let i = 0; i < arr.length; i++) arr[i] = i & 0xff
const blob = new Blob([arr])

const encryptor = naclBlob.encrypt(key, nonce, blob, (err, encryptedBlob) => {
  if (err) throw (err)
  // some time later
  const decryptor = naclBlob.decrypt(key, nonce, encryptedBlob, (err, decryptedBlob) => {
    if (err) throw (err)
    compareBlobs(blob, decryptedBlob)
  })
  decryptor.on('progress', ({position, length}) => { console.log('decrypting ' + (position / length) * 100 + '%') })
})

encryptor.on('progress', ({position, length}) => { console.log('encrypting ' + (position / length) * 100 + '%') })

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

/* eslint-env browser */
const test = require('tape')
const naclBlob = require('../index')

test('test stream', t => {
  const key = new Uint8Array(32)
  const nonce = new Uint8Array(16)
  // var arr = nacl.util.decodeUTF8('Hello, chunky!');
  const arr = new Uint8Array(10)
  for (let i = 0; i < arr.length; i++) arr[i] = i & 0xff
  const blob = new Blob([arr])

  naclBlob.encrypt(key, nonce, blob, (err, encrypted) => {
    t.error(err)

    naclBlob.encrypt(key, nonce, new Blob([encrypted]), (err, decrypted) => {
      t.error(err)

      console.log(arr)
      console.log(decrypted)
      compareBlobs(new Blob([arr]), new Blob([decrypted]))
      t.end()
    })
  })
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

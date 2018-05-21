/* eslint-env browser */
const str2ab = require('string-to-arraybuffer')

function uInt8ArrayToToBase64 (arrayBuffer) {
  var decoder = new TextDecoder('utf8')
  return btoa(decoder.decode(arrayBuffer))
}

exports.uInt8ArrayToToBase64 = uInt8ArrayToToBase64

function base64ToUInt8Array (base64) {
  return new Uint8Array(str2ab(base64))
}

exports.base64ToUInt8Array = base64ToUInt8Array

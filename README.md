# nacl-blob [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Encrypt and decrypt DOM blobs using [nacl-stream](https://github.com/dchest/nacl-stream-js) within service workers.  A port of `nacl-stream-js`'s demo into a consumable module.

## Usage

```js
const naclBlob = require('nacl-blob')

const key = new Uint8Array(32)
const nonce = new Uint8Array(16)

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
  decryptor.on('progress', ({position, length}) => { console.log('decrypting %' + (position / length) * 100) })
})

encryptor.on('progress', ({position, length}) => { console.log('encrypting %' + (position / length) * 100) })


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
```

## API

### `encrypt = require('nacl-blob').encrypt`

Import the `encrypt` function.

### `decrypt = require('nacl-blob').decrypt`

Import the `decrypt` function.

**Note**

This module uses a build-time [browserify](http://browserify.org) transform called [`workerify`](https://github.com/shama/workerify).  If you are not using browserify, you can import from the transformed version of the module by importing from the `nacl-blob/dist` path. e.g:

```js
const encrypt = require('nacl-blob/dist').encrypt
const decrypt = require('nacl-blob/dist').decrypt
```

### `encrypt(key, nonce, blob, [opts], cb)`

Encrypt a [File](file) or [Blob](blob), using a `key` and `nonce`.  Returns an event emitter that can be used to display encryption progress.  The encrypted data will be returned in the callback as a [Blob][blob].

The `key` must be a 32-byte [Uint8Array][uint8] or [Node.js Buffer][nodebuff] (see [github.com/dchest/tweetnacl-js#usage](https://github.com/dchest/tweetnacl-js#usage) for details).

The `nonce` must be a 16-byte [Uint8Array][uint8] or [Node.js Buffer][nodebuff].  

The `blob` must be a [Blob][blob] or [File][file].

Optional `opts` include: 

```js
{
  chunkSize: 1024 * 1024,
  mimeType: blob.type
}
```

The `cb` function will fire when the file/blob has been encrypted and have the the following arguments:

- `err`: Any error that occurred durning encryption.  You should handle this.
- `encryptedBlob`: a [Blob][blob] containing the encrypted data.  This can be securely stored/transmitted along with the `nonce` across insecure networks and decrypted with the `key` (assuming secure key exchange is performed elsewhere).

Returns an [Event Emitter][bus] that you can use to listen for the following events:

- `progress`: An event that emits the the progress of encryption in the following shape:

```js
{
  progress, // in bytes
  length // total bytes
}
```

### `decrypt(key, nonce, encryptedBlob, [opts], [cb])`

Decrypt a [Blob][blob] that was encrypted using a `key` and `nonce`.  Returns an event emitter that can be used to track progress.  The decrypted data will be returned in the callback as a [Blob][blob].

The `key` must be the same 32-byte [Uint8Array][uint8] or [Node.js Buffer][nodebuff] used to encrypt the file. (see [github.com/dchest/tweetnacl-js#usage]

The `nonce` must be the same 16-byte [Uint8Array][uint8] or [Node.js Buffer][nodebuff] used to encrypt the file.

The `encryptedBlob` must be an encrypted [Blob][blob] or [File][file].

Optional `opts` include:

```js
{
  chunkSize: 1024 * 1024,
  mimeType: encryptedBlob.type
}
```

The `cb` function will fire when the file/blob has been decrypted and have the the following arguments:

- `err`: Any error that occurred durning encryption.  You should handle this.
- `decryptedBlob`: a [Blob][blob] containing the decrypted data.

Returns an [Event Emitter][bus] that you can use to listen for the following events:

- `progress`: An event that emits the the progress of encryption in the following shape:

```js
{
  progress, // in bytes
  length // total bytes
}
```

## See Also

- https://github.com/jedisct1/libsodium.js
- https://github.com/jedisct1/libsodium/issues/475
- https://developer.mozilla.org/en-US/docs/Web/API/Body/blob

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/nacl-blob.svg?style=flat-square
[3]: https://npmjs.org/package/nacl-blob
[4]: https://img.shields.io/travis/bcomnes/nacl-blob/master.svg?style=flat-square
[5]: https://travis-ci.org/bcomnes/nacl-blob
[8]: http://img.shields.io/npm/dm/nacl-blob.svg?style=flat-square
[9]: https://npmjs.org/package/nacl-blob
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[uint8]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[file]: https://developer.mozilla.org/en-US/docs/Web/API/File
[blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob
[bus]: https://github.com/choojs/nanobus
[nodebuff]: https://nodejs.org/api/buffer.html

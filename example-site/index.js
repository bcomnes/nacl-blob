/* eslint-env browser */
const { encrypt } = require('../index.js')
const document = require('global/document')

const { uInt8ArrayToToBase64, base64ToUInt8Array } = require('./util')

const fileLoader = document.querySelector('#load-file')
const encryptButton = document.querySelector('#encrypt-button')
const encryptionMessages = document.querySelector('#encrypt-messages')
const inputImage = document.querySelector('#input-image')
const encryptionKeyInput = document.querySelector('#encryption-key')
const nonceField = document.querySelector('#nonce')
const keyUsed = document.querySelector('#key-used')
const downloadEncrypted = document.querySelector('#download-encrypted')
const encryptionErrors = document.querySelector('#encrypt-errors')

let fileSelected = null
let encryptionKey = new Uint8Array(32)
let encrypted = null

encryptionKeyInput.value = uInt8ArrayToToBase64(encryptionKey)

fileLoader.addEventListener('change', ev => {
  fileSelected = ev.currentTarget.files[0]
  if (fileSelected) {
    encryptButton.removeAttribute('disabled')
    encryptionMessages.innerText = `type: ${fileSelected.type} size: ${fileSelected.size}`
    if (fileSelected.type.startsWith('image')) {
      const reader = new FileReader()
      reader.addEventListener('load', function () {
        inputImage.src = reader.result
      })

      reader.readAsDataURL(fileSelected)
    }
  }
})

encryptionKeyInput.addEventListener('input', ev => {
  encryptionKey = base64ToUInt8Array(ev.currentTarget.value)
  console.log(encryptionKey)
})

encryptButton.addEventListener('click', ev => {
  if (fileSelected) {
    const nonce = new Uint8Array(16)
    const key = encryptionKey
    const encryptor = encrypt(key, nonce, fileSelected, (err, encryptedBlob) => {
      if (err) {
        encryptionErrors.innerText = err.message || err
        return
      }

      nonceField.value = uInt8ArrayToToBase64(nonce)
      keyUsed.value = uInt8ArrayToToBase64(key)
      encrypted = encryptedBlob
      downloadEncrypted.removeAttribute('disabled')

      const reader = new FileReader()
      reader.addEventListener('load', function () {
        downloadEncrypted.href = reader.result
      })

      reader.readAsDataURL(encrypted)
    })

    encryptor.on('progress', ({ position, length }) => {
      encryptionErrors.innerText = `${(position / length) * 100}%`
    })
  }
})

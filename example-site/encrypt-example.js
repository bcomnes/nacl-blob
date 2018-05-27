/* eslint-env browser */
const { encrypt } = require('../index.js')
const qs = document.querySelector.bind(document)
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

const fileLoader = qs('#load-file')
const encryptButton = qs('#encrypt-button')
const encryptionMessages = qs('#encrypt-messages')
const inputImage = qs('#input-image')
const encryptionKeyInput = qs('#encryption-key')
const nonceField = qs('#nonce')
const keyUsed = qs('#key-used')
const downloadEncrypted = qs('#download-encrypted')
const encryptionErrors = qs('#encrypt-errors')
const generateEncryptionKeyButton = qs('#generate-encryption-key')

let fileSelected = null

let encryptionKey = nacl.box.keyPair().secretKey
encryptionKeyInput.value = nacl.util.encodeBase64(encryptionKey)
let encrypted = null
let encryptedObjURL = null

generateEncryptionKeyButton.addEventListener('click', () => {
  encryptionKey = nacl.box.keyPair().secretKey
  encryptionKeyInput.value = nacl.util.encodeBase64(encryptionKey)
})

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
  encryptionKey = nacl.util.decodeBase64(ev.currentTarget.value)
  console.log(encryptionKey)
})

encryptButton.addEventListener('click', ev => {
  if (fileSelected) {
    if (encryptedObjURL) URL.revokeObjectURL(encryptedObjURL)
    const nonce = nacl.randomBytes(16)
    const key = encryptionKey
    const encryptor = encrypt(key, nonce, fileSelected, (err, encryptedBlob) => {
      if (err) {
        encryptionErrors.innerText = err.message || err
        return
      }

      nonceField.value = nacl.util.encodeBase64(nonce)
      keyUsed.value = nacl.util.encodeBase64(key)
      encrypted = encryptedBlob
      downloadEncrypted.removeAttribute('disabled')
      encryptedObjURL = URL.createObjectURL(encrypted)
      downloadEncrypted.href = encryptedObjURL
    })

    encryptor.on('progress', ({ position, length }) => {
      encryptionErrors.innerText = `${(position / length) * 100}%`
    })
  }
})

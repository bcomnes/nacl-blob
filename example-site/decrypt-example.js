const { decrypt } = require('../index.js')
const qs = document.querySelector.bind(document)
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')
const fetch = require('node-fetch')

const testDataName = '/encrypted-test-data.gif'

const decryptSelect = qs('#decryptselect')
const decryptFile = qs('#load-decrypt-file')
const decryptKey = qs('#decrypt-key')
const decryptNonce = qs('#decrypt-nonce')
const decryptButton = qs('#decrypt-button')
const decryptMessage = qs('#decrypt-messages')
const decryptImage = qs('#decrypted-image')
const decryptDownload = qs('#decrypted-download-link')

const gifKey = decryptKey.value
const gifNonce = decryptNonce.value

let decryptMode = 'gif'
let uploadFileObj = null
let decryptedPreviewURLObj = null

decryptSelect.addEventListener('change', ev => {
  const source = ev.target.value

  switch (source) {
    case 'gif': {
      decryptMode = 'gif'
      decryptFile.setAttribute('disabled', '')
      decryptKey.setAttribute('disabled', '')
      decryptKey.value = gifKey
      decryptNonce.setAttribute('disabled', '')
      decryptNonce.value = gifNonce
      decryptMessage.innerText = ''
      decryptButton.innerText = 'Download and decrypt'
      decryptButton.removeAttribute('disabled')
      break
    }
    case 'upload':
    default: {
      decryptMode = 'upload'
      decryptFile.removeAttribute('disabled')
      decryptKey.removeAttribute('disabled')
      decryptNonce.removeAttribute('disabled')
      decryptButton.innerText = 'Load and decrypt'
      if (decryptFile.files.length > 0) {
        decryptButton.removeAttribute('disabled')
      } else {
        decryptButton.setAttribute('disabled', '')
      }
      break
    }
  }
})

decryptFile.addEventListener('change', ev => {
  uploadFileObj = ev.currentTarget.files[0]
  if (uploadFileObj) {
    decryptButton.removeAttribute('disabled')
    decryptMessage.innerText = `type: ${uploadFileObj.type} size: ${uploadFileObj.size}`
  }
})

decryptButton.addEventListener('click', ev => {
  decryptButton.setAttribute('disabled', '')
  decryptButton.innerText = 'Loading...'
  if (decryptedPreviewURLObj) URL.revokeObjectURL(decryptedPreviewURLObj)
  switch (decryptMode) {
    case 'gif': {
      fetch(testDataName).then(function (response) {
        if (response.ok) {
          return response.blob()
        }
        throw new Error('Network response was not ok.')
      }).then(encryptedBlob => {
        decryptMessage.innerText = decryptMessage.innerText = 'Got blob'
        return new Promise((resolve, reject) => {
          const key = nacl.util.decodeBase64(decryptKey.value)
          const nonce = nacl.util.decodeBase64(decryptNonce.value)
          const decryptor = decrypt(key, nonce, encryptedBlob, (err, decryptedBlob) => {
            if (err) return reject(err)
            resolve(decryptedBlob)
          })
          decryptor.on('progress', ({ position, length }) => {
            decryptMessage.innerText = `decrypting: ${(position / length) * 100}%`
          })
        })
      }).then(decyptedBlob => {
        decryptedPreviewURLObj = URL.createObjectURL(decyptedBlob)

        if (decyptedBlob.type.startsWith('image')) {
          decryptImage.src = decryptedPreviewURLObj
        }
        decryptDownload.href = decryptedPreviewURLObj
      }).catch(err => {
        decryptMessage.innerText = err.message
      }).then(() => {
        decryptButton.innerText = 'Download and decrypt'
        decryptButton.removeAttribute('disabled')
      })
      break
    }
    case 'upload':
    default: {
      break
    }
  }
})

const test = require('tape')
const naclBlob = require('./index.js')

test('do webworkers turn on?', t => {
  naclBlob.encrypt(null, null, null, null, null, () => {
    t.end()
  })
})

/* eslint-env worker */

onmessage = function (ev) {
  switch (ev.data.name) {
    default: {
      postMessage({
        name: 'ECHO',
        msg: JSON.stringify(ev.data)
      })
    }
  }
}

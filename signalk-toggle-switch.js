
const storeName = 'skpersist'

module.exports = function(RED) {
  function SignalKToggleSwitch(config) {
    RED.nodes.createNode(this,config);
    const node = this;

    const globalContext = node.context().global
    const app = globalContext.get('app')

    let path = config.path
    if ( !path.endsWith('.state') ) {
      path += '.state'
    }

    function handlePut(context, path, value, cb) {
      value = value === 1 || value === true
      globalContext.set(path, value, storeName)
      sendUpdate(value)
      node.send({ topic: path, payload: value })
      node.status({ fill: "green", shape: "dot", text: `put received: ${value}` });
      return { state: 'SUCCESS' }
    }

    function sendUpdate(value) {
      let delta = {
        updates: [
          {
            values: [
              {
                value,
                path: path
              }
            ]
          }
        ]
      }
      app.handleMessage('signalk-node-red', delta)
    }

    app.registerPutHandler('vessels.self', path, handlePut)

    let resendInterval

    globalContext.get(path, storeName, (err, value) => {
      if (config.displayName && config.displayName.length > 0) {
        let delta = {
          updates: [
            {
              meta: [
                {
                  value: { displayName: config.displayName },
                  path: path
                }
              ]
            }
          ]
        }
        app.handleMessage('signalk-node-red', delta)
      }

      sendUpdate(value !== undefined ? value : false)
      resendInterval = setInterval(() => {
        globalContext.get(path, storeName, (err, value) => {
          sendUpdate(value !== undefined ? value : false)
        })
      }, 5000)
    })

    node.on('input', msg => {
      if ( typeof msg.payload === 'boolean' ) {
        globalContext.set(path, msg.payload, storeName)
        sendUpdate(msg.payload)
        node.status({fill:"green",shape:"dot",text:`input: ${msg.payload}`});
        node.send({topic: path, payload: msg.payload})
      } else {
        node.error('payload must be boolean')
        node.status({fill:"red",shape:"dot",text:`invalid input`});
      }
    })
    
    node.on('close', function() {
      if (resendInterval) {
        clearInterval(resendInterval)
      }
    })
  }
  RED.nodes.registerType("signalk-toggle-switch", SignalKToggleSwitch);
}

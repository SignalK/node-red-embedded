
const storeName = 'skpersist'

module.exports = function(RED) {
  function SignalKMultiSwitch(config) {
    RED.nodes.createNode(this,config);
    const node = this;

    const globalContext = node.context().global
    const app = globalContext.get('app')

    if ( config.options.length === 0 ) {
      node.error('at least one option must be defined')
      node.status({ fill: "red", shape: "dot", text: 'at least one option must be defined' });
      return
    } else {
      node.status({})
    }

    let path = config.path
    if ( !path.endsWith('.state') ) {
      path += '.state'
    }

    function handlePut(context, path, value, cb) {
      if ( config.options.indexOf(value) === -1 ) {
        node.error(`invalid value: ${value}`)
        node.status({ fill: "red", shape: "dot", text: `invalid value: ${value}` })
        return { state: 'COMPLETED', statusCode:400, message: 'Invalid value' }
      } else {
        globalContext.set(path, value, storeName)
        sendUpdate(value)
        node.send({ topic: path, payload: value })
        node.status({ fill: "green", shape: "dot", text: `put received: ${value}` })
        return { state: 'SUCCESS' }
      }
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
      let possibleValues = config.options.map(option => ({ title: option, value: option }))

      let delta = {
        updates: [
          {
            meta: [
              {
                value: {
                  displayName: config.displayName,
                  possibleValues: possibleValues,
                  type: 'multiple'
                },
                path: path
              }
            ]
          }
        ]
      }
      app.handleMessage('signalk-node-red', delta)

      sendUpdate(value !== undefined ? value : config.options[0])
      resendInterval = setInterval(() => {
        globalContext.get(path, storeName, (err, value) => {
          value = value !== undefined ? value : config.options[0]
          sendUpdate(value)
          node.status({ fill: "green", shape: "dot", text: `value: ${value}` });
        })
      }, 5000)
      
    })

    node.on('input', msg => {
      if ( config.options.indexOf(msg.payload) !== -1 ) {
        globalContext.set(path, msg.payload, storeName)
        sendUpdate(msg.payload)
        node.status({fill:"green",shape:"dot",text:`input: ${msg.payload}`});
        node.send({topic: path, payload: msg.payload})
      } else {
        node.error(`payload must be one of: ${config.options.join(', ')}`)
        node.status({fill:"red",shape:"dot",text:`invalid input`});
      }
    })
    
    node.on('close', function() {
      if (resendInterval) {
        clearInterval(resendInterval)
      }
    })
  }
  RED.nodes.registerType("signalk-multi-switch", SignalKMultiSwitch);
}

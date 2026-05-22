
const storeName = 'skpersist'

module.exports = function(RED) {
  function SignalKMultiSwitch(config) {
    RED.nodes.createNode(this,config);
    const node = this;

    function getOptionWithValue(value) {
      return config.options.find(opt => opt.value == value)
    }

    function setStatusWithValue(value) {
      const option = getOptionWithValue(value)
      node.status({ fill: "green", shape: "dot", text: `value: ${option ? option.title : value}` });
    }

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
      const option = getOptionWithValue(value)
      if ( !option ) {
        node.error(`invalid value: ${value}`)
        node.status({ fill: "red", shape: "dot", text: `invalid value: ${value}` })
        return { state: 'COMPLETED', statusCode:400, message: 'Invalid value' }
      } else {
        globalContext.set(path, option.value, storeName)
        sendUpdate(option.value)
        node.send({ topic: path, payload: option.value })
        node.status({ fill: "green", shape: "dot", text: `put received: ${option.title}` })
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
      let possibleValues = config.options

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

      sendUpdate(value !== undefined ? value : config.options[0].value)
      resendInterval = setInterval(() => {
        globalContext.get(path, storeName, (err, value) => {
          value = value !== undefined ? value : config.options[0].value
          sendUpdate(value)
          setStatusWithValue(value);
        })
      }, 5000)
      
    })

    node.on('input', msg => {
      const option = getOptionWithValue(msg.payload)
      if ( option ) {
        globalContext.set(path, option.value, storeName)
        sendUpdate(option.value)
        node.status({fill:"green",shape:"dot",text:`input: ${option.title}`});
        node.send({topic: path, payload: option.value})
      } else {
        node.error(`payload must be one of: ${config.options.map(opt => opt.value).join(', ')}`)
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

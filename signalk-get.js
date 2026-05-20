
module.exports = function(RED) {
  function signalKGet(config) {
    RED.nodes.createNode(this,config)
    var node = this

    var app = node.context().global.get('app')

    function onError(err) {
      node.error(err)
      console.error(err.stack)
      node.status({fill:"red",shape:"dot",text:err.message})
    }

    node.on('input', msg => {
      node.status({fill:"yellow",shape:"dot",text:`sending...`})
      try {
        const path = config.path && config.path.length > 0 ? config.path : msg.topic
        let res = app.getSelfPath(path) 
        if ( res && res.value !== null && res.value !== undefined ) {
          node.status({fill:'green',shape:"dot",text:`value: ${res.value}`})
          node.send([{ payload: res.value }, null])
        } else {
          node.status({fill:'red',shape:"dot",text:`not found`})
          node.send([null, { payload: `not found` }])
        }
      } catch (err) {
        onError(err)
      }
    })
  }
  RED.nodes.registerType("signalk-get", signalKGet)
}

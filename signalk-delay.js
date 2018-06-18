
module.exports = function(RED) {
  function signalK(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    node.on('input', msg => {
      const _ = node.context().global.get('lodash')
    
      let firstMessage = node.context().get('firstMessage')
      let lastValue = node.context().get('lastValue')

      if ( lastValue && !_.isEqual(msg.payload, lastValue))
      {
        firstMessage = null
      }
      
      if ( !firstMessage ) {
        node.context().set('firstMessage', Date.now())
        node.context().set('lastValue', msg.payload)
      } else if ( Date.now() - firstMessage > (config.delay) ) {
        node.send(msg)
      }

    })
  }
  RED.nodes.registerType("signalk-delay", signalK);
}

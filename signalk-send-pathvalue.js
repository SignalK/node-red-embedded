
module.exports = function(RED) {
  function signalKSendPathValue(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    var source = config.name ? 'node-red-' + config.name : 'node-red'
    
    node.on('input', msg => {
      let delta = {
        updates: [
          {
            values: [
              {
                value: msg.payload,
                path: msg.topic
              }
            ]
          }
        ]
      }
      if ( config.source && config.source.length > 0 ) {
        delta.updates[0].$source = config.source
      }
      app.handleMessage(source, delta)
    })
  }
  RED.nodes.registerType("signalk-send-pathvalue", signalKSendPathValue);
}

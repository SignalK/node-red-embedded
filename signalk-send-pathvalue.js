
module.exports = function(RED) {
  function signalKSendPathValue(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    var source = config.name ? 'node-red-' + config.name : 'node-red'
    
    node.on('input', msg => {
      app.handleMessage(source, {
        updates: [
          {
            values: [
              msg.payload
            ]
          }
        ]
      })
    })
  }
  RED.nodes.registerType("signalk-send-pathvalue", signalKSendPathValue);
}

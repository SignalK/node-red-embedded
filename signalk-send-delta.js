
module.exports = function(RED) {
  function signalKSendDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    let app = node.context().global.get('app')
    let source = config.name ? 'node-red-' + config.name : 'node-red'
    
    node.on('input', msg => {
      app.handleMessage(source, msg.payload)
    })
  }
  RED.nodes.registerType("signalk-send-delta", signalKSendDelta);
}

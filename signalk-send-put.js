
module.exports = function(RED) {
  function signalKSendPut(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    
    node.on('input', msg => {
      node.log(`setting ${config.path} to ${msg.payload}`)
      app.putSelfPath(config.path, msg.payload)
    })
  }
  RED.nodes.registerType("signalk-send-put", signalKSendPut);
}

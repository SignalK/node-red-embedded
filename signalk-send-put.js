
module.exports = function(RED) {
  function signalKSendPut(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    
    node.on('input', msg => {
      app.putSelfPath(config.path, msg.payload)
      node.status({fill:"green",shape:"dot",text:`value: ${msg.payload}`});
    })
  }
  RED.nodes.registerType("signalk-send-put", signalKSendPut);
}

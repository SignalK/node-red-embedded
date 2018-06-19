
module.exports = function(RED) {
  function signalKSendPut(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    
    node.on('input', msg => {
      try {
        app.putSelfPath(config.path, msg.payload)
      } catch (err) {
        node.error(err)
        console.error(err.stack);
      }
      
      node.status({fill:"green",shape:"dot",text:`value: ${msg.payload}`});
    })
  }
  RED.nodes.registerType("signalk-send-put", signalKSendPut);
}

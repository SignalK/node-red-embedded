
module.exports = function(RED) {
  function signalKSendDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    let app = node.context().global.get('app')
    let source = config.name ? 'node-red-' + config.name : 'node-red'

    let showingStatus = false
    function showStatus() {
      if ( ! showingStatus ) {
        node.status({fill:"green",shape:"dot",text:"sent"});
        showingStatus = true;
        setTimeout( () => {
          node.status({});
          showingStatus = false
        }, 1000)
      }
    }
    
    node.on('input', msg => {
      app.handleMessage(source, msg.payload)
      showStatus()
    })
  }
  RED.nodes.registerType("signalk-send-delta", signalKSendDelta);
}

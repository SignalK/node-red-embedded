
module.exports = function(RED) {
  function SignalKOnEvent(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    
    let showingStatus = false
    function showStatus() {
      if ( ! showingStatus ) {
        node.status({fill:"green",shape:"dot",text:"sending"});
        showingStatus = true;
        setTimeout( () => {
          node.status({});
          showingStatus = false
        }, 1000)
      }
    }

    function on_event(data) {
      showStatus()
      node.send({ payload: data })
    }
    
    app.on(config.event, on_event)

    node.on('close', function() {
      signalk.removeListener(config.event, on_event)
    })
  }
  RED.nodes.registerType("signalk-app-event", SignalKOnEvent);
}

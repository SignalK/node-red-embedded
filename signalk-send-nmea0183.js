

module.exports = function(RED) {
  function send(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    let app = node.context().global.get('app')

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
    
    node.on('input', msg => {
      showStatus()
      app.emit(config.nmea0183Event, msg.payload)
    })
  }
  RED.nodes.registerType("signalk-send-nmea0183", send);
}

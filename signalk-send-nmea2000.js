

module.exports = function(RED) {
  function send(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    let app = node.context().global.get('app')
    let _ = node.context().global.get('lodash')

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
      if ( _.isObject(msg.payload) ) {
        app.emit(config.nmea2000JsonEvent, msg.payload)
      } else {
        app.emit(config.nmea2000Event, msg.payload)
      }
    })
  }
  RED.nodes.registerType("signalk-send-nmea2000", send);
}

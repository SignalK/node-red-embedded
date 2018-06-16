

module.exports = function(RED) {
  function send(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    let app = node.context().global.get('app')
    let _ = node.context().global.get('lodash')
    
    node.on('input', msg => {
      if ( _.isObject(msg.payload) ) {
        app.emit(config.nmea2000JsonEvent, msg.payload)
      } else {
        app.emit(config.nmea2000Event, msg.payload)
      }
    })
  }
  RED.nodes.registerType("signalk-send-nmea2000", send);
}

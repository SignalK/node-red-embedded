

module.exports = function(RED) {
  function send(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    let app = node.context().global.get('app')
    
    node.on('input', msg => {
      app.emit(config.nmea0183Event, msg.payload)
    })
  }
  RED.nodes.registerType("signalk-send-nmea0183", send);
}

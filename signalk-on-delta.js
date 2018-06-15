
module.exports = function(RED) {
  function SignalKOnDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var signalk = node.context().global.get('signalk')

    function on_delta(delta) {
      node.send({ payload: delta })
    }
    
    signalk.on('delta', on_delta)

    node.on('close', function() {
      signalk.removeListener('delta', on_delta)
    })
  }
  RED.nodes.registerType("signalk-on-delta", SignalKOnDelta);
}

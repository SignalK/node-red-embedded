
module.exports = function(RED) {
  function SignalKOnDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var signalk = node.context().global.get('signalk')

    signalk.on('delta', delta => {
      node.send({ payload: delta })
    })
  }
  RED.nodes.registerType("signalk-on-delta", SignalKOnDelta);
}

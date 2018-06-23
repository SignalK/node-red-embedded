
module.exports = function(RED) {
  function SignalK(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')

    let onClose = app.registerDeltaInputHandler((id, delta, next) => {
      node.context().flow.set('signalk-input-handler.next', next)
      node.send({payload: delta})
    })

    node.on('close', function() {
      onClose()
    })
  }
  RED.nodes.registerType("signalk-input-handler", SignalK);
}


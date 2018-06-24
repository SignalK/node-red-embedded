
module.exports = function(RED) {
  function SignalK(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var plugin = node.context().global.get('plugin')

    let onClose = plugin.registerDeltaInputHandler(config.context,
                                                   config.path,
                                                   config.source,
                                                   (pv, next) => {
                                                     node.context().flow.set('signalk-input-handler.next', next)
                                                     node.send(pv)
                                                   })

    node.on('close', function() {
      onClose()
    })
  }
  RED.nodes.registerType("signalk-input-handler", SignalK);
}


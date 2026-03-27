
module.exports = function(RED) {
  function SignalK(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')

    node.on('input', msg => {
      let cb = msg.putCallBack
      if ( cb ) {
        cb({ state: 'COMPLETED', statusCode: msg.payload?.statusCode || 500, message: msg.payload?.message || 'Error'})
      } else {
        node.error('No callback provided for put response')
      }
    })
  }
  RED.nodes.registerType("signalk-put-error", SignalK);
}


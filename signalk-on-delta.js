
module.exports = function(RED) {
  function SignalKOnDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var signalk = node.context().global.get('signalk')
    var app = node.context().global.get('app')

    function on_delta(delta) {
      if ( delta.updates ) {
        var copy = JSON.parse(JSON.stringify(delta))
        copy.updates = []
        delta.updates.forEach(update => {
          if ( update.values &&
               (!update.$source || !update.$source.startsWith('signalk-node-red') )) {
            copy.updates.push(update)
          }
        })

        if ( copy.updates.length > 0 ) {
          if ( copy.context == app.selfContext ) {
            copy.context = 'vessels.self'
          }
          node.send({ payload: copy })
        }
      }
    }
    
    signalk.on('delta', on_delta)

    node.on('close', function() {
      signalk.removeListener('delta', on_delta)
    })
  }
  RED.nodes.registerType("signalk-on-delta", SignalKOnDelta);
}


module.exports = function(RED) {
  function SignalKOnDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var signalk = node.context().global.get('signalk')
    var app = node.context().global.get('app')

    function on_delta(delta) {
      if ( delta.updates ) {
        if ( delta.context === config.context ||
             (config.context === 'vessels.self' &&
              delta.context == app.selfContext) ) {
          if ( typeof config.flatten === 'undefined' || !config.flatten ) {
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
          } else {
            delta.updates.forEach(update => {
              if ( update.values &&
                   (!update.$source || !update.$source.startsWith('signalk-node-red') )) {
                update.values.forEach(pathValue => {
                  node.send({
                    $source: update.$source,
                    source: update.source,
                    context: delta.context == app.selfContext ? 'vessels.self' : delta.context,
                    payload: pathValue.value,
                    topic: pathValue.path
                  })
              })
              }
            })
          }
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


module.exports = function(RED) {
  function signalKFilterDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    node.on('input', msg => {
      let delta = msg.payload
      if ( delta.updates ) {
        delta.updates.forEach(update => {
          if ( !update.$source || !update.$source.startsWith('signalk-node-red') ) {
            if ( update.values ) {
              update.values.forEach(pathValue => {
                if ( pathValue.path == config.path ) {
                  let copy = JSON.parse(JSON.stringify(pathValue))
                  copy.$source = update.$source
                  copy.source = update.source
                  node.send({ payload: copy})
                }
              })
            }
          }
        })
      }
    })
  }
  RED.nodes.registerType("signalk-filter-delta", signalKFilterDelta);
}

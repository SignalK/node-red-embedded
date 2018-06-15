
module.exports = function(RED) {
  function signalKFlattenDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    node.on('input', msg => {
      let delta = msg.payload
      if ( delta.updates ) {
        delta.updates.forEach(update => {
          if ( update.values ) {
            update.values.forEach(pathValue => {
              pathValue.$source = update.$source
              pathValue.source = update.source
              pathValue.context = delta.context
              node.send({ payload: pathValue})
            })
          }
        })
      }
    })
  }
  RED.nodes.registerType("signalk-flatten-delta", signalKFlattenDelta);
}

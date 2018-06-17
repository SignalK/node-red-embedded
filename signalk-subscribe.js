
module.exports = function(RED) {
  function input(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var signalk = node.context().global.get('signalk')
    var app = node.context().global.get('app')
    var smanager = node.context().global.get('subscriptionmanager')
    var onStop = []

    if ( !config.path || config.path.length == 0 ) {
      node.error('no path specified')
      return
    }

    let subscription = {
      "context": config.context,
      subscribe: [{
        path: config.path,
        period: config.period
      }]
    }


    function on_delta(delta) {
      if ( delta.updates ) {
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

    smanager.subscribe(subscription,
                       onStop,
                       (err) => {
                         node.error('subscription error', err)
                       },
                       on_delta);

    
    node.on('close', function() {
      onStop.forEach(f => f());
      onStop = []
    })
  }
  RED.nodes.registerType("signalk-subscribe", input);
}

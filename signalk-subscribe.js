
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

    let showingStatus = false
    function showStatus(value, title) {
      if ( ! showingStatus ) {
        if ( !title ) {
          title = 'sending'
        }
        node.status({fill:"green",shape:"dot",text: value != null ? `${title} ${value}` : "sending"});
        showingStatus = true;
        setTimeout( () => {
          node.status({});
          showingStatus = false
        }, 1000)
      }
    }

    function on_delta(delta) {
      if ( delta.updates ) {
        try {
        
        if ( typeof config.flatten === 'undefined' || !config.flatten ) {
          var copy = JSON.parse(JSON.stringify(delta))
          copy.updates = []
          delta.updates.forEach(update => {
            if ( update.values &&
                 (!update.$source ||
                  (!update.$source.startsWith('signalk-node-red')
                  || config.source === 'signalk-node-red') )
                 && (!config.source || update.$source == config.source) ) {

              let last = node.context()[update.values[0].path]
              let current = update.values[0].value
              if ( !last && config.mode === 'sendChangesIgnore' ) {
                showStatus(current, 'ignoring')
                node.context()[update.values[0].path] = current
                return
              } else if ( !config.mode || config.mode === 'sendAll' || !last
                          || (last != current) ) {
                node.context()[update.values[0].path] = current
                copy.updates.push(update)
              }  else {
                showStatus(current, 'ignoring')
              }
            }
          })
          
          if ( copy.updates.length > 0 ) {
            showStatus(copy.updates[0].values[0].value)
            if ( copy.context == app.selfContext ) {
              copy.context = 'vessels.self'
            }
            node.send({ payload: copy  })
          }
        } else {
          delta.updates.forEach(update => {
            if ( update.values &&
                 (!update.$source || 
                  (!update.$source.startsWith('signalk-node-red')
                   || config.source === 'signalk-node-red') )
                 && ((!config.source || config.source.length === 0)
                     || update.$source == config.source) ) {
              update.values.forEach(pathValue => {
                let last = node.context()[pathValue.path]
                let current = pathValue.value
                if ( !last && config.mode === 'sendChangesIgnore' ) {
                  node.context()[pathValue.path] = current
                  showStatus(current, 'ignoring')
                  return
                } else if ( !config.mode || config.mode === 'sendAll' || !last
                            || (last != current) ) {
                  showStatus(pathValue.value)
                  node.context()[pathValue.path] = current
                  node.send({
                    $source: update.$source,
                    source: update.source,
                    context: delta.context == app.selfContext ? 'vessels.self' : delta.context,
                    payload: pathValue.value,
                    topic: pathValue.path,
                    timestamp: update.timestamp
                  })
                } else {
                  showStatus(current, 'ignoring')
                }
              })
            }
          })
        }
        } catch ( err ) {
          node.error(err)
          console.error(err.stack);
        }
      }
    }

    setTimeout( () => {
      smanager.subscribe(subscription,
                         onStop,
                         (err) => {
                           node.error('subscription error', err)
                         },
                         on_delta);
    }, 5000)

    
    node.on('close', function() {
      onStop.forEach(f => f());
      onStop = []
    })
  }
  RED.nodes.registerType("signalk-subscribe", input);
}

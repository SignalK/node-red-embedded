module.exports = function(RED) {
  function signalk(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var unsubscribes = []

    const geodist = node.context().global.get('geodist')
    const subscriptionmanager = node.context().global.get('subscriptionmanager')
    const app = node.context().global.get('app')

    var command = {
      context: config.context,
      subscribe: [{
        path: 'navigation.position',
        period: config.period
      }]
    }
    
    subscriptionmanager.subscribe(command, unsubscribes, error => {
      node.error('subscription error: ' + error)
    }, delta => {
      let pos = delta.updates[0].values[0]

      if ( !pos.value || !pos.value.latitude || !pos.value.longitude ) {
        node.status({fill:"red",shape:"dot",text:"no position"});
        return
      }
      pos = pos.value

      var fencePos = null;
      if ( config.myposition ) {
        var mypos = app.getSelfPath('navigation.position.value')
        if ( mypos && mypos.latitude && mypos.longitude ) {
          fencePos = { lat: mypos.latitude, lon: mypos.longitude }
        }
      } else {
        fencePos = { lat: config.lat, lon: config.lon }
      }

      if ( fencePos ) {
        let dist = geodist(fencePos, 
                           {lat: pos.latitude, lon: pos.longitude},
                           { unit: 'meters'})
        if ( dist > config.distance ) {
          node.status({fill:"green",shape:"dot",text:"outside fence"});
          node.send([null, { payload: 'outside' }, { payload: 'outside' }]);
        } else {
          node.status({fill:"green",shape:"dot",text:"inside fence"});
          node.send([{ payload: 'inside' }, null, { payload: 'inside' }]);
        }
      }
    })

    node.on('close', function() {
      unsubscribes.forEach(function(func) { func() })
      unsubscribes = []
    })
  }
  RED.nodes.registerType("signalk-geofence", signalk);
}

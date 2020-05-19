module.exports = function(RED) {
  function signalk(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var unsubscribes = []

    const geodist = node.context().global.get('geodist')
    const subscriptionmanager = node.context().global.get('subscriptionmanager')
    const app = node.context().global.get('app')
    const context = node.context()

    node.on('input', msg => {
      if ( msg.payload.latitude ) {
        context.latitude = msg.payload.latitude
        context.longitude = msg.payload.longitude
      }
      if ( msg.payload.distance ) {
        context.distance = msg.payload.distance
      }
    })

    var command = {
      context: config.context,
      subscribe: [{
        path: 'navigation.position',
        period: config.period
      }]
    }

    //wait a second because the node is not yet wired up
    setTimeout(() => {
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
        if ( context.latitude ) {
          fencePos = { lat: context.latitude, lon: context.longitude }
        } else {
          fencePos = { lat: config.lat, lon: config.lon }
        }
        if ( fencePos.lat === 0 && fencePos.lon === 0 ) {
          return
        }
      }

      if ( fencePos ) {
        let dist = geodist(fencePos, 
                           {lat: pos.latitude, lon: pos.longitude},
                           { unit: 'meters'})
        let status
        let payload
        const distance = context.distance ? context.distance : config.distance
        if ( dist > distance ) {
          status = {fill:"green",shape:"dot",text:"outside fence"}
          payload = [null, { payload: 'outside' }, { payload: 'outside' }]
        } else {
          status = {fill:"green",shape:"dot",text:"inside fence"}
          payload = [{ payload: 'inside' }, null, { payload: 'inside' }]
        }

        let last = node.context().get('lastValue')
        let current = payload[2].payload
        //console.log(`${last} ${current} ${config.mode}`)
        if ( !last && config.mode === 'sendChangesIgnore' ) {
          node.context().set('lastValue', current)
          return
        } else if ( !config.mode || config.mode === 'sendAll' || !last
                    || last != current ) {
          node.context().set('lastValue', current)
          node.status(status);
          node.send(payload)
        } 
      }
    })
    }, 5000)

    node.on('close', function() {
      unsubscribes.forEach(function(func) { func() })
      unsubscribes = []
    })
  }
  RED.nodes.registerType("signalk-geofence", signalk);
}

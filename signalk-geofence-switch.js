module.exports = function(RED) {
  function signalk(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var unsubscribes = []

    const geodist = node.context().global.get('geodist')
    const app = node.context().global.get('app')
    const context = node.context()

    node.on('input', (msg) => {

      if ( msg.topic === 'signalk-config' ) {
        context.latitude = msg.payload.latitude
        context.longitude = msg.payload.longitude
        context.distance = msg.payload.distance
        return
      }
      
      var pos;

      if ( config.context !== 'vessels.self' ) {
        pos = app.getPath(config.context + '.navigation.position.value')
      } else {
        pos = app.getSelfPath('navigation.position.value')
      }

      if ( !pos || !pos.latitude || !pos.longitude ) {
        node.status({fill:"red",shape:"dot",text:"no position"});
        return
      }
      
      var fencePos = null;
      if ( config.myposition ) {
        var mypos = app.getSelfPath('navigation.position.value')
        if ( mypos && mypos.latitude && mypos.longitude ) {
          fencePos = { lat: mypos.latitude, lon: mypos.longitude }
        }
      } else {
        if ( msg.latitude ) {
          fencePos = { lat: msg.latitude, lon: msg.longitude }
        } else if ( context.latitude ) {
          fencePos = { lat: context.latitude, lon: context.longitude }
        } else {        
          fencePos = { lat: config.lat, lon: config.lon }
        }
        if ( fencePos.lat === 0 && fencePos.lon === 0 ) {
          node.status({fill:"red",shape:"dot",text:"no lat/lon"});
          return
        }
      }

      
      if ( fencePos ) {
        let curPos = {lat: pos.latitude, lon: pos.longitude}
        let dist = geodist(fencePos, 
                           curPos,
                           { unit: 'meters'})
        let distance
        if ( msg.distance ) {
          distance = msg.distance
        } else if ( context.distance ) {
          distance = context.distance
        } else {
          distance = config.distance
        }

        if ( dist > distance ) {
          node.status({fill:"green",shape:"dot",text:"outside fence"});
          node.send([null, msg ])
        } else {
          node.status({fill:"green",shape:"dot",text:"inside fence"});
          node.send([msg, null])
        }
      }
    })
  }
  RED.nodes.registerType("signalk-geofence-switch", signalk);
}

module.exports = function(RED) {
  function signalk(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var unsubscribes = []

    const geodist = node.context().global.get('geodist')
    const app = node.context().global.get('app')


    node.on('input', (msg) => {
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
        fencePos = { lat: config.lat, lon: config.lon }
      }

      
      if ( fencePos ) {
        let curPos = {lat: pos.latitude, lon: pos.longitude}
        let dist = geodist(fencePos, 
                           curPos,
                           { unit: 'meters'})
        if ( dist > config.distance ) {
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

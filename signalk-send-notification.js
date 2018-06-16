
module.exports = function(RED) {
  function signalKSendNotification(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    const _ = node.context().global.get('lodash')
    
    node.on('input', msg => {
      let info = _.isObject(msg.payload) ? msg.payload : null
      let path = info && info.path ? info.path : config.path
      let state = info && info.state ? info.state : config.state
      let message = info && info.message ? info.message : config.message
      let method
      if ( info && info.method ){
        method = info.method
      } else {
        method = []
        if ( config.visual ) {
          method.push('visual')
        }
        if ( config.sound ) {
          method.push('sound')
        }
      } 
      
      
      let delta = {
        updates: [
          {
            values: [
              {
                path: 'notifications.' + path,
                value: {
                  state: state,
                  method: method,
                  message: message
                }
              }
            ]
          }
        ]
      }
      node.log(JSON.stringify(delta))
      app.handleMessage('signalk-node-red', delta)
    })
  }
  RED.nodes.registerType("signalk-send-notification", signalKSendNotification);
}

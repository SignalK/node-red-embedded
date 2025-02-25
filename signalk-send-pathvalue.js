
module.exports = function(RED) {
  function signalKSendPathValue(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    var source = config.name ? 'node-red-' + config.name : 'node-red'
    var sentMeta = {}

    function showStatus(text) {
      node.status({fill:"green",shape:"dot",text:text});
    }
    
    node.on('input', msg => {
      if ( !msg.topic ) {
        node.error('no topic for incomming message')
        return
      }

      let path = msg.topic

      if ( typeof config.meta !== 'undefined' && config.meta !== "" && !sentMeta[path] ) {
        let delta = {
          updates: [
            {
              meta: [
                {
                  value: JSON.parse(config.meta),
                  path
                }
              ]
            }
        ]
        }
        if ( config.source && config.source.length > 0 ) {
          delta.updates[0].$source = config.source
        }
        app.handleMessage(source, delta)
        sentMeta[path] = true
      }
      
      let delta = {
        updates: [
          {
            values: [
              {
                value: msg.payload,
                path
              }
            ]
          }
        ]
      }
      if ( config.source && config.source.length > 0 ) {
        delta.updates[0].$source = config.source
      }
      let c = path.lastIndexOf('.')
      showStatus(`${path.substring(c+1)}: ${msg.payload}`)
      app.handleMessage(source, delta)
    })
  }
  RED.nodes.registerType("signalk-send-pathvalue", signalKSendPathValue);
}

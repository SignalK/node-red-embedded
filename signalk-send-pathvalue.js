
module.exports = function(RED) {
  function signalKSendPathValue(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')
    var source = config.name ? 'node-red-' + config.name : 'node-red'
    var sentMeta = false

    function showStatus(text) {
      node.status({fill:"green",shape:"dot",text:text});
    }
    
    node.on('input', msg => {
      if ( !msg.topic ) {
        node.error('no topic for incomming message')
        return
      }

      if ( config.meta !== "" && !sentMeta ) {
        let delta = {
          updates: [
            {
              meta: [
                {
                  value: JSON.parse(config.meta),
                  path: msg.topic
                }
              ]
            }
        ]
        }
        if ( config.source && config.source.length > 0 ) {
          delta.updates[0].$source = config.source
        }
        app.handleMessage(source, delta)
        sentMeta = true
      }
      
      let delta = {
        updates: [
          {
            values: [
              {
                value: msg.payload,
                path: msg.topic
              }
            ]
          }
        ]
      }
      if ( config.source && config.source.length > 0 ) {
        delta.updates[0].$source = config.source
      }
      let c = msg.topic.lastIndexOf('.')
      showStatus(`${msg.topic.substring(c+1)}: ${msg.payload}`)
      app.handleMessage(source, delta)
    })
  }
  RED.nodes.registerType("signalk-send-pathvalue", signalKSendPathValue);
}

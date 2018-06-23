
module.exports = function(RED) {
  function SignalK(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')

    node.on('input', msg => {
      let next = node.context().flow.get('signalk-input-handler.next')
      if ( msg.topic ) {
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
        if ( msg.source && msg.source.length > 0 ) {
          delta.updates[0].$source = msg.source
        }
        next('node-red', delta)
        let c = msg.topic.lastIndexOf('.')
      } else {
        next('node-red', msg.payload)
      }
    })
  }
  RED.nodes.registerType("signalk-input-handler-next", SignalK);
}


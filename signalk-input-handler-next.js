
module.exports = function(RED) {
  function SignalK(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')

    node.on('input', msg => {
      let next = node.context().flow.get('signalk-input-handler.next')
      if ( msg.next ) {
        next = msg.next
      }
      if ( msg.topic ) {
        let delta = {
          context: msg.context,
          updates: [
            {
              source: msg.source,
              $source: msg.$source,
              timestamp: msg.timestamp,
              values: [
                {
                  value: msg.payload,
                  path: msg.topic
                }
              ]
            }
          ]
        }
        /*
        if ( msg.source && msg.source.length > 0 ) {
          delta.updates[0].$source = msg.source
        }
        */
        //node.error(JSON.stringify(delta))
        //console.log(JSON.stringify(delta))
        next(delta)
      } else {
        //next(msg.payload)
      }
    })
  }
  RED.nodes.registerType("signalk-input-handler-next", SignalK);
}


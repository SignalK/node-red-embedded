
module.exports = function(RED) {
  function signalKSendPut(config) {
    RED.nodes.createNode(this,config)
    var node = this

    var app = node.context().global.get('app')

    function onError(err) {
      node.error(err)
      console.error(err.stack)
      node.status({fill:"red",shape:"dot",text:err.message})
    }

    node.on('input', msg => {
      node.status({fill:"yellow",shape:"dot",text:`sending...`})
      try {
        const path = config.path && config.path.length > 0 ? config.path : msg.topic
        let res = app.putSelfPath(path, msg.payload, (reply) => {
          if ( reply.state === 'COMPLETED' ) {
            if ( reply.statusCode === 200 ) {
              node.status({fill:'green',shape:"dot",text:`value: ${msg.payload}`})
              node.send([{ payload: reply, putCallBack: msg.putCallBack}, null])
            } else if ( reply.state === 'PENDING' ) {
              node.status({fill:'yellow',shape:"dot",text:'pending...'})
            } else {
              node.status({fill:'red',shape:"dot",text:`error`})
              node.error(`put error ${reply.statusCode} ${reply.message || ''}`)
              node.send([null, { payload: reply, putCallBack: msg.putCallBack}])
            }
          }
        }, config.source && config.source.length > 0 ? config.source : undefined)
      } catch (err) {
        onError(err)
      }
    })
  }
  RED.nodes.registerType("signalk-send-put", signalKSendPut)
}

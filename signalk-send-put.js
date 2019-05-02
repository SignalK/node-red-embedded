
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
        let res = app.putSelfPath(config.path, msg.payload, (reply) => {
          if ( reply.state === 'COMPLETED' ) {
            if ( reply.statusCode === 200 ) {
              node.status({fill:'green',shape:"dot",text:`value: ${msg.payload}`})
            } else {
              node.status({fill:'red',shape:"dot",text:`error`})
              node.error(`put error ${reply.statusCode} ${reply.message || ''}`)
              if ( reply.message ) {
                node.error(reply.message)
              }
            }
          }
        })
        Promise.resolve(res)
          .then(reply => {
            let fill
            let text
            if ( !app.queryRequest || (reply.state === 'COMPLETED' && reply.result === 200) ) {
              fill = 'green'
              text = `value: ${msg.payload}`
            } else if ( reply.state === 'PENDING' ) {
              fill = 'yellow'
              text = 'pending...'
            } else {
              fill = 'red'
              text = `error : ${reply.result} ${reply.message || ''}`
            }
            node.status({fill:fill,shape:"dot",text:text})
          })
          .catch(onError)
      } catch (err) {
        onError(err)
      }
    })
  }
  RED.nodes.registerType("signalk-send-put", signalKSendPut)
}

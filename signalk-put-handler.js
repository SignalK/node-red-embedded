
module.exports = function(RED) {
  function SignalKOnDelta(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    var app = node.context().global.get('app')

    function handlePut(context, path, value, cb) {
      node.send({topic: path, payload: value})
      return { state: 'SUCCESS' }
    }

    let deReg = app.registerActionHandler('vessels.self', config.path,
                                          handlePut)
    
    node.on('close', function() {
      //deReg()
    })
  }
  RED.nodes.registerType("signalk-put-handler", SignalKOnDelta);
}

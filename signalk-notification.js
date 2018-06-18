
module.exports = function(RED) {
  function SignalKNotification(config) {
    RED.nodes.createNode(this,config);
    var node = this;
    var unsubscribes = []

    let showingStatus = false
    function showStatus() {
      if ( ! showingStatus ) {
        node.status({fill:"green",shape:"dot",text:"sending"});
        showingStatus = true;
        setTimeout( () => {
          node.status({});
          showingStatus = false
        }, 1000)
      }
    }
    
    var subscriptionmanager = node.context().global.get('subscriptionmanager')

    var path = config.notification === 'any' || config.notification.length === 0 ? 'notifications.*' : 'notifications.' + config.notification

    var command = {
      context: "vessels.self",
      subscribe: [{
        path: path,
        policy: 'instant'
      }]
    }
    
    subscriptionmanager.subscribe(command, unsubscribes, error => {
      node.error('subscription error: ' + error)
    }, delta => {
      let notification = delta.updates[0].values[0]

      if ( config.state === 'any' || (notification.value && notification.value.state == config.state) ) {
        showStatus()
        node.send({ payload: notification})
      }
    })

    node.on('close', function() {
      unsubscribes.forEach(function(func) { func() })
      unsubscribes = []
    })
  }
  RED.nodes.registerType("signalk-notification", SignalKNotification);
}

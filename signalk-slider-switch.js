
const storeName = 'skpersist'

module.exports = function(RED) {
  function SignalKSliderSwitch(config) {
    RED.nodes.createNode(this, config)
    const node = this

    const globalContext = node.context().global
    const app = globalContext.get('app')

    const rangeMin = Number(config.rangeMin)
    const rangeMax = Number(config.rangeMax)
    const stepSize = config.stepSize !== '' && config.stepSize !== undefined
      ? Number(config.stepSize)
      : undefined
    const units = config.units && config.units.length > 0
      ? config.units
      : undefined

    let path = config.path
    if (!path.endsWith('.state')) {
      path += '.state'
    }

    function parseValue(value) {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) {
        return undefined
      }
      if (numericValue < rangeMin || numericValue > rangeMax) {
        return undefined
      }
      return numericValue
    }

    function sendValue(value) {
      const delta = {
        updates: [
          {
            values: [
              { value, path }
            ]
          }
        ]
      }
      app.handleMessage('signalk-node-red', delta)
    }

    function publishMeta() {
      const metaValue = {
        rangeMin,
        rangeMax
      }

      if (stepSize !== undefined) {
        metaValue.stepSize = stepSize
      }

      if (config.displayName && config.displayName.length > 0) {
        metaValue.displayName = config.displayName
      }

      if (units !== undefined) {
        metaValue.units = units
      }

      const delta = {
        updates: [
          {
            meta: [
              { value: metaValue, path }
            ]
          }
        ]
      }
      app.handleMessage('signalk-node-red', delta)
    }

    function handleValue(value, source) {
      const parsed = parseValue(value)
      if (parsed === undefined) {
        node.error(`invalid value: ${value} (must be a number between ${rangeMin} and ${rangeMax})`)
        node.status({ fill: 'red', shape: 'dot', text: `invalid value: ${value}` })
        return { state: 'COMPLETED', statusCode: 400, message: 'Invalid value' }
      }

      globalContext.set(path, parsed, storeName)
      sendValue(parsed)
      node.send({ topic: path, payload: parsed })
      node.status({ fill: 'green', shape: 'dot', text: `value: ${parsed}` })
      return { state: 'COMPLETED', statusCode: 200 }

    }

    app.registerPutHandler('vessels.self', path, (context, p, value, cb) =>
      handleValue(value, 'put')
    )

    publishMeta()

    globalContext.get(path, storeName, (err, value) => {
      const initial = value !== undefined ? value : rangeMin
      globalContext.set(path, initial, storeName)
      node.status({ fill: 'green', shape: 'dot', text: `value: ${initial}` })
    })

    const resendInterval = setInterval(() => {
      globalContext.get(path, storeName, (err, value) => {
        const resolved = value !== undefined ? value : rangeMin
        sendValue(resolved)
        node.status({ fill: 'green', shape: 'dot', text: `value: ${resolved}` })
      })
    }, 5000)

    node.on('input', msg => {
      handleValue(msg.payload, 'input')
    })

    node.on('close', function() {
      clearInterval(resendInterval)
    })
  }

  RED.nodes.registerType('signalk-slider-switch', SignalKSliderSwitch)
}

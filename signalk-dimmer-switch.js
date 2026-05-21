
const storeName = 'skpersist'

module.exports = function(RED) {
  function SignalKDimmerSwitch(config) {
    RED.nodes.createNode(this, config)
    const node = this

    const globalContext = node.context().global
    const app = globalContext.get('app')
    const includeState = config.includeState === true

    function normalizeBasePath(path) {
      if (path.endsWith('.dimmingLevel')) {
        return path.slice(0, -'.dimmingLevel'.length)
      }
      if (path.endsWith('.state')) {
        return path.slice(0, -'.state'.length)
      }
      return path
    }

    const basePath = normalizeBasePath(config.path)
    const dimmingPath = `${basePath}.dimmingLevel`
    const statePath = `${basePath}.state`

    function parseDimmingLevel(value) {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 1) {
        return undefined
      }
      return numericValue
    }

    function parseState(value) {
      if (value === true || value === 1 ) {
        return true
      }
      if (value === false || value === 0 ) {
        return false
      }
      return undefined
    }

    function sendValue(path, value) {
      const delta = {
        updates: [
          {
            values: [
              {
                value,
                path
              }
            ]
          }
        ]
      }
      app.handleMessage('signalk-node-red', delta)
    }

    function publishMeta(path, displayName, units) {
      if (!displayName || displayName.length === 0) {
        return
      }

      const delta = {
        updates: [
          {
            meta: [
              {
                value: { displayName, units },
                path
              }
            ]
          }
        ]
      }
      app.handleMessage('signalk-node-red', delta)
    }

    function updateStatus(dimmingLevel, state) {
      const stateText = includeState ? `, state: ${state}` : ''
      node.status({ fill: 'green', shape: 'dot', text: `dimmingLevel: ${dimmingLevel}${stateText}` })
    }

    function sendOutput(dimmingLevel, state) {
      let dimmingObj = null
      let stateObj = null
      let object = {topic: basePath, payload: {}}

      if (state !== null) {
        stateObj = {
          topic: statePath,
          payload: state
        }
        object.payload.state = state
      }

      if ( dimmingLevel !== null) {
        dimmingObj = {
          topic: dimmingPath,
          payload: dimmingLevel
        }
        object.payload.dimmingLevel = dimmingLevel
      }
      
      const out = [dimmingObj, stateObj, object]
      node.send(out)
      updateStatus(dimmingLevel, state)
    }

    function setDimmingLevel(value, source) {
      const dimmingLevel = parseDimmingLevel(value)
      if (dimmingLevel === undefined) {
        node.error(`invalid dimmingLevel: ${value}`)
        node.status({ fill: 'red', shape: 'dot', text: `invalid dimmingLevel: ${value}` })
        return { state: 'COMPLETED', statusCode: 400, message: 'Invalid dimmingLevel' }
      }

      globalContext.set(dimmingPath, dimmingLevel, storeName)
      sendValue(dimmingPath, dimmingLevel)

      if (includeState) {
        const state = dimmingLevel > 0
        globalContext.set(statePath, state, storeName)
        sendValue(statePath, state)
      }

      return { state: 'COMPLETED', statusCode: 200 }
    }

    function setState(value) {
      const state = parseState(value)
      if (state === undefined) {
        node.error(`invalid state: ${value}`)
        node.status({ fill: 'red', shape: 'dot', text: `invalid state: ${value}` })
        return { state: 'COMPLETED', statusCode: 400, message: 'Invalid state' }
      }

      globalContext.set(statePath, state, storeName)
      sendValue(statePath, state)

      return { state: 'COMPLETED', statusCode: 200 }
    }

    app.registerPutHandler('vessels.self', dimmingPath, (context, path, value, cb) => {
      const res = setDimmingLevel(value, 'put')
      if (res.statusCode === 200) {
        sendOutput(value, null)
      }
      return res
    })

    if (includeState) {
      app.registerPutHandler('vessels.self', statePath, (context, path, value, cb) => {
        const res = setState(value)
        if (res.statusCode === 200) {
          sendOutput(null, value)
        }
        return res
      })
    }

    publishMeta(dimmingPath, config.displayName, 'ratio')
    if (includeState) {
      publishMeta(statePath, config.displayName)
    }

    globalContext.get(dimmingPath, storeName, (err, dimmingLevel) => {
      const initialDimming = dimmingLevel !== undefined ? dimmingLevel : 0
      globalContext.set(dimmingPath, initialDimming, storeName)
      sendValue(dimmingPath, initialDimming)

      if (includeState) {
        globalContext.get(statePath, storeName, (stateErr, state) => {
          const initialState = state !== undefined ? state : initialDimming > 0
          globalContext.set(statePath, initialState, storeName)
          sendValue(statePath, initialState)
        })
      } 
    })

    const resendInterval = setInterval(() => {
      globalContext.get(dimmingPath, storeName, (err, dimmingLevel) => {
        const resolvedDimming = dimmingLevel !== undefined ? dimmingLevel : 0
        sendValue(dimmingPath, resolvedDimming)

        if (includeState) {
          globalContext.get(statePath, storeName, (stateErr, state) => {
            const resolvedState = state !== undefined ? state : false
            sendValue(statePath, resolvedState)
            updateStatus(resolvedDimming, resolvedState)
          })
        } else {
          updateStatus(resolvedDimming)
        }
      })
    }, 5000)

    node.on('input', msg => {
      if (typeof msg.payload === 'number' || typeof msg.payload === 'string') {
        const result = setDimmingLevel(msg.payload, 'input')
        if (result.statusCode === 200) {
           sendOutput(msg.payload, null)
          return
        }
      } else if (includeState && typeof msg.payload === 'boolean') {
        const stateResult = setState(msg.payload)
        if (stateResult.statusCode === 200) {
          sendOutput(null, msg.payload)
          return
        }
      } else if (typeof msg.payload === 'object') {
        let changed = false

        if (msg.payload.dimmingLevel !== undefined) {
          const dimResult = setDimmingLevel(msg.payload.dimmingLevel, 'input')
          if (dimResult.statusCode !== 200) {
            return
          }
          changed = true
        }

        if (includeState && msg.payload.state !== undefined) {
          const stateResult = setState(msg.payload.state)
          if (stateResult.statusCode !== 200) {
            return
          }
          changed = true
        }

        if (changed) {
          sendOutput(msg.payload.dimmingLevel, includeState && msg.payload.state !== undefined ? msg.payload.state : null)
          return
        }
      }

      node.error('payload must be a dimmingLevel between 0 and 1, a boolean, or an object with dimmingLevel and optional state')
      node.status({ fill: 'red', shape: 'dot', text: 'invalid input' })
    })

    node.on('close', function() {
      clearInterval(resendInterval)
    })
  }

  RED.nodes.registerType('signalk-dimmer-switch', SignalKDimmerSwitch)
}

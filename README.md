# node-red-embedded
Node red nodes for use with the signalk-node-red plugin

# Available Nodes

## signalk-on-delta

Input that sends messages for every delta the server receives

## signalk-flatten-delta

Function that flatten deltas from signalk-on-delta.

The output payload with be have path, value, source and context:

```
{
  "path":"navigation.speedOverGround",
  "value":2.45,
  "source":{"label":"actisense","type":"NMEA2000","pgn":129026,"src":"3",
  "context": "vessels.self"
}
```

## signalk-send-pathvalue

Output that sends a delta through the server. Input should be path and value

```
{
  "path":"navigation.speedOverGround",
  "value":20.45
}
```

## signalk-notification

Input that sends a message when a notification is received. Configuration allows messages for a specific notification or any notification. The notification state can also be specified. Payload will be the notification path and value.

```
{
  "path: "notifications.anchorAlarm",
  "value" : {
    "state" : "emergency",
    "method" : [
      "visual",
      "sound"
    ],
    "timestamp" : "2018-06-15T15:01:55.007Z",
    "message" : "Anchor Alarm - Emergency"
  }
}
```

## signalk-send-delta

Output that sends a delta to the server. Input should be a fully formed SignalK delta

## signalk-send-put

Output that send a SignalK put request via `app.putSelfPath`. Input should be the value to put.


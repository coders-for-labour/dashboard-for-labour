Polymer({
  is: 'd4l-dashboard-card',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    background: {
      type: String,
      notify: true
    },
    disabled: {
      type: String,
      notify: true
    }
  }
});
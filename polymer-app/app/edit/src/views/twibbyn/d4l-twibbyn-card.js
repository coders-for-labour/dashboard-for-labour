Polymer({
  is: 'd4l-twibbyn-card',
  behaviors: [
    D4L.Logging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    twibbyn:{
      type: String
    },
    __twibbynEndpoint: {
      type: String,
      value: 'http://cdn.forlabour.com/'
    }
  }
});
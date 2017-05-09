Polymer({
  is: 'd4l-twibbyn-campaign-card',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LCardBehavior
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    campaign: {
      type: Object
    }
  },
  __viewTwibbyn: function(){
    this.fire('view-entity', `/twibbyn/${this.get('campaign').id}`);
  }
});
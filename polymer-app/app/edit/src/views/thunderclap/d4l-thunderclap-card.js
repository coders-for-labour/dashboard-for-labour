Polymer({
  is: 'd4l-thunderclap-card',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LCardBehavior
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    type: {
      type: String,
      value: 'thunderclap'
    },
    campaign: {
      type: Object
    }
  },
  __viewThunderclap: function(){
    this.fire('view-entity', `/${this.type}/${this.get('campaign').id}`);
  }
});

Polymer({
  is: 'd4l-meme-campaign-card',
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
  __viewMeme: function(){
    this.fire('view-entity', `/meme/${this.get('campaign').id}`);
  }
});

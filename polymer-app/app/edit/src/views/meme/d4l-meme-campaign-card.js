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
    type: {
      type: String,
      value: 'meme'
    },
    campaign: {
      type: Object
    }
  },
  __viewMeme: function(){
    this.fire('view-entity', `/${this.type}/${this.get('campaign').id}`);
  }
});

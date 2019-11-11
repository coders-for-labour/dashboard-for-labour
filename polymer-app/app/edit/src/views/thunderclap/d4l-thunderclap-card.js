Polymer({
  is: 'd4l-thunderclap-card',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    Polymer.D4LCardBehavior
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    auth: {
      type: Object
    },
    db: {
      type: Object,
      notify: true
    },

    __userCountLabel: {
      type: Number,
      value: 0,
      computed: '__computeUserCountLabel(thunderclap, thunderclap.supporters.length)'
    }
  },
  observers: [
  ],

  __tap: function(){
    this.__subscribeThunderclap();
  },

  __viewThunderclap: function(){
    this.fire('view-entity', `/thunderclap/${this.get('thunderclap.id')}`);
  },

  __subscribeThunderclap: function(){
    const thunderclap = this.get('thunderclap');

    this.fire('subscribe', {
      id: thunderclap.id,
      text: thunderclap.description
    });
  },

  __computeUserCountLabel: function(){
    const count = this.get('thunderclap.supporters.length');
    if (!count) return 0;
    return count;
  }

});

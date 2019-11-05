Polymer({
  is: 'd4l-thunderclap-card',
  behaviors: [
    D4L.Logging,
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
      type: String,
      computed: '__computeUserCountLabel(thunderclap, thunderclap.supporters.length)'
    },

    __thunderclapTime: {
      type: String,
      computed: '__computeThunderclapTime(thunderclap.thunderclapTime, thunderclap)'
    },
    __thunderClapDaysLeft: {
      type: String,
      computed: '__computeThunderClapLeft(__thunderclapTime)'
    },
    __thunderClapFormatted: {
      type: String,
      computed: '__computeThunderClapFormatted(__thunderclapTime)'
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

    this.fire('subscribe', {id: thunderclap.id, text: thunderclap.description});
  },

  __computeUserCountLabel: function(){
    const count = this.get('thunderclap.supporters.length');
    if (!count) return ;0;
    return count;
  },

  __computeThunderclapTime: function(time) {
    if (!time || !time === '') {
      return Sugar.Date.create('now');
    }

    return Sugar.Date.create(time);
  },
  __computeThunderClapLeft: function(time) {
    return Sugar.Date.relative(time);
  },
  __computeThunderClapFormatted: function(time) {
    return Sugar.Date.format(time, '{Dow} {do} {Month}, {12hr}:{mm}{tt}');
  }

});

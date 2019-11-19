Polymer({
  is: 'd4l-thunderclap-detail',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Thunderclap.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4
    },
    auth: {
      type: Object
    },
    db: {
      type: Object,
      notify: true
    },
    thunderclap: {
      type: Object
    },

    __topic: {
      type: Object
    },
    __topicQuery: {
      type: Object,
      computed: '__computeTopicQuery(thunderclap.topicId, db.topic.data.*)'
    },

    __subscribed: {
      type: Boolean,
      value: false
    }

  },
  observers: [
    '__thunderclapChanged(thunderclap)'
  ],

  __thunderclapChanged: function() {
    this.set('__subscribed', false);
  },

  __subscribeThunderclap: function(){
    const thunderclap = this.get('thunderclap');

    return this.subscribeThunderclap({
      detail: {
        id: thunderclap.id,
        text: thunderclap.description,
        suffix: thunderclap.suffix ? thunderclap.suffix : '#d4l #ge2019'
      }
    })
    .then(() => this.set('__subscribed', true));
  },

  __computeTopicQuery(topicId, cr) {
    return {
      __crPath: cr.path,
      id: {
        $eq: topicId
      }
    };
  }

});

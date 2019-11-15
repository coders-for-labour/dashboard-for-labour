Polymer({
  is: 'd4l-dashboard-constituency-card',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Topic.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    db: {
      type: Object,
      notify: true
    },
    auth: {
      type: Object,
      notify: true,
    },
    constituency: {
      type: Object,
      value: null,
      notify: true
    },
    mp: {
      type: Object,
      notify: true,
    },
    __formError: {
      type: String,
      value: null
    },
    __postcode: {
      type: String,
      value: ''
    },
    __hasConstituency: {
      type: Boolean,
      computed: '__computeHasConstituency(constituency)'
    }
  },

  viewTopicConstituency: function() {
    const topics = this.get('db.topic.data');
    if (!topics) throw new Error('Missing TOPIC database');

    const constituency = this.get('constituency');
    if (!constituency) {
      this.__warning(`Missing constituency`);
      return;
    }

    const topic = topics.find(t => t.constituencyPano == constituency.pano );
    if (!topic) {
      this.__warning(`Unable to find topic for constituency ${constituency.pano}`);
      return;
    }

    this.viewTopic(topic.id);
  },

  __resetConstituency: function() {
    // this.set('auth.metadata.constituencyName', '');
    this.set('constituency', null);
    this.set('__postcode', '');
  },

  __findConstituency: function() {
    const ajax = this.$.ajax;
    const postcode = this.get('__postcode');
    if (!postcode) {
      return;
    }

    this.set('__formError', null);

    return ajax.send({
      url: '/api/v1/constituency',
      method: 'GET',
      contentType: 'application/json',
      params: {
        postcode: postcode
      }
    })
    .then(res => {
      if (!res.response) {
        this.__resetConstituency();
        this.set('__formError', 'Invalid Postcode');
        return;
      }
      this.set('constituency', res.response);
    })
    .catch(err => {
      this.__resetConstituency();

      if (err.response) {
        this.set('__formError', err.response.message);
        return;
      }

      this.__err(err);
    });
  },

  __checkForReturn: function(ev) {
    if (ev.key === 'Enter') {
      this.__findConstituency();
    }
  },

  __computeHasConstituency: function() {
    return this.get('constituency') ? true : false;
  }
});

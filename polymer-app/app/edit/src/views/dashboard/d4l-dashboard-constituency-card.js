Polymer({
  is: 'd4l-dashboard-constituency-card',
  behaviors: [
    D4L.Logging,
    D4L.Topic.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4
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
    __rqParams: {
      type: Object,
      value: function() {
        return {
          postcode: ''
        };
      }
    },
    __rqResponse: {
      type: Object,
      observer: '__onRqResponse'
    },
    __hasConstituency: {
      type: Boolean,
      computed: '__computeHasConstituency(constituency)'
    }
  },
  observers: [
    '__onUserMetadataChanged(auth.user.metadata.*)'
  ],

  __onUserMetadataChanged: function() {
    // if (this.get('constituency') || !this.get('auth.metadata.constituencyName')) {
    //   return;
    // }
    // this.set('__rqParams.name', this.get('auth.metadata.constituencyName'));
    // this.$.findConstituency.generateRequest();
  },

  viewTopicConstituency: function() {
    const topics = this.get('db.topic.data');
    if (!topics) throw new Error('Missing TOPIC database');
    const constituency = this.get('constituency');
    if (!constituency) {
      this.__warning(`Missing constituency`);
      return;
    }
    let rootTopic = topics.find(t => !t.parentId && t.constituencyPano == constituency.pano );
    this.__silly(topics, constituency, rootTopic);
    if (!rootTopic) {
      const dbFactory = this.get('db.Factory');
      const topic = dbFactory.create('topic');
      topic.name = constituency.name;

      const r17 = constituency.results['2017'].results;
      const mp = r17[0];
      const labourIdx = r17.findIndex(mp => mp.party === 'Labour');
      const labour = r17[labourIdx];
      const labourBehind = r17.reduce((behind, mp, idx) => {
        if (idx >= labourIdx) return behind;
        behind += mp.ahead;
        return behind;
      }, 0)
      if (labour !== mp) {
        topic.description = `
          This seat is currently held by ${mp.party} with a majority of ${mp.ahead}. The MP is ${mp.name}. The Labour MP in the 2017 election was ${labour.name}. We need ${labourBehind} votes to win this seat. 
        `;
      } else {
        topic.description = `
          This seat is currently held by Labour with a majority of ${mp.ahead}. Your MP is ${mp.name}.
        `;
      }
      topic.constituencyPano = constituency.pano;
      this.__silly(topic);
      this.push('db.topic.data', topic);
      rootTopic = topic;
    }

    this.viewTopic(rootTopic.id);
  },

  __resetConstituency: function() {
    // this.set('auth.metadata.constituencyName', '');
    this.set('constituency', null);
    this.set('__rqParams.name', '');
    this.set('__rqParams.postcode', '');
  },

  __findConstituency: function() {
    if (!this.get('__rqParams.postcode')) {
      return;
    }

    // this.set('auth.metadata.postCode', this.get('__rqParams.postcode'));
    this.$.findConstituency.generateRequest();
  },

  __onRqResponse: function(response) {
    this.__silly(this.get('auth.user'));
    this.__debug(response);
    if (!response) {
      return;
    }

    this.set('constituency', response);
    // this.linkPaths('mp', 'constituency.results.2015.results.0');
    // this.set('mp', this.get('constituency.results.2015.results.0'));
    // if (this.get('auth.metadata.constituencyName')) {
    //   return;
    // }
    // this.set('auth.metadata.constituencyName', response.name);
  },

  __computeHasConstituency: function() {
    return this.get('constituency') ? true : false;
  }
});

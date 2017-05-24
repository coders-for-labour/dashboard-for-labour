Polymer({
  is: 'd4l-dashboard-constituency-card',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4
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
    if (this.get('constituency') || !this.get('auth.metadata.constituencyName')) {
      return;
    }
    this.set('__rqParams.name', this.get('auth.metadata.constituencyName'));
    this.$.findConstituency.generateRequest();
  },

  __resetConstituency: function() {
    this.set('auth.metadata.constituencyName', '');
    this.set('constituency', null);
    this.set('__rqParams.name', '');
    this.set('__rqParams.postcode', '');
  },

  __findConstituency: function() {
    if (!this.get('__rqParams.postcode')) {
      return;
    }

    this.set('auth.metadata.postCode', this.get('__rqParams.postcode'));
    this.$.findConstituency.generateRequest();
  },

  __onRqResponse: function(response) {
    this.__debug(this.get('auth.user'));
    this.__debug(response);
    if (!response) {
      return;
    }

    this.set('constituency', response);
    this.linkPaths('mp', 'constituency.results.2015.results.0');
    this.set('mp', this.get('constituency.results.2015.results.0'));
    if (this.get('auth.metadata.constituencyName')) {
      return;
    }
    this.set('auth.metadata.constituencyName', response.name);
  },

  __computeHasConstituency: function() {
    return this.get('constituency') ? true : false;
  }
});

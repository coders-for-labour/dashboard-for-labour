Polymer({
  is: 'd4l-thunderclap',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LViewList,
    Polymer.D4LFacebook,
    Polymer.D4LShare
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
      notify: true
    },
    campaign: {
      type: Object
    },
    campaigns: {
      type: Array
    },

    __campaignId: {
      type: String
    },
    __campaignText: {
      type: String
    },

    __tweetBody: {
      type: Object
    },

    __openPostDialog: {
      type: Boolean,
      value: false
    },

    __thunderclapEndpoint: {
      type: String,
      value: '//%{D4L_CDN_URL}%'
    },
    __thunderclapTwitterUrl: {
      type: String,
      value: '/api/v1/thunderclap/twitter/subscribe'
    },

    __thunderclapSubscribeUrl: {
      type: String
    },
    __thunderclapSubscribeBody: {
      type: Object
    },

    __pageTitle: {
      type: String,
      value: 'Thunderclap',
      computed: '__computePageTitle(__selectedItem)'
    },

    __hasUserTwitter: {
      type: Boolean,
      notify: true,
      value: false,
      computed: '__computeHasUserTwitter(auth.user, auth.user.auth.*)'
    }
  },

  __test() {
    console.log(this.get('db.thunderclap.data.0.supporters'));
    this.push('db.thunderclap.data.0.supporters', 'test');
  },

  __subscribeThunderclap: function(ev) {
    this.__debug(ev.detail);
    this.__campaignId = ev.detail.id;
    this.__campaignText = ev.detail.text;
    this.__openPostDialog = true;
  },

  __saveThunderclap: function(ev) {
    this.__debug(ev.detail);
    if (!this.__campaignId) {
      this.__warn('No campaign set!');
      return;
    }

    this.set('__thunderclapSubscribeUrl', this.get('__thunderclapTwitterUrl'));
    this.set('__thunderclapSubscribeBody', {
      id: this.__campaignId,
      message: ev.detail.text
    });

    this.__campaignId = '';
    this.__campaignText = '';

    this.$.ajaxSubscribeThunderclap.generateRequest();
  },

  __thunderclapResponse: function(){
    // this.__debug(res);
  },

  __sharedTw: function() {
    this.set('__shareTwStatus', 'shared');
  },

  __sharedTwErr: function() {
    this.set('__shareTwStatus', 'ready');
  },

  __computeThunderclapQuery: function () {
    console.log('__computeThunderclapQuery');
    return {
    }
  },

  __computePageTitle: function (campaign) {
    let title = 'Thunderclap';

    this.__debug(title);

    if (campaign && campaign.name) {
      title = `${title} - ${campaign.name}`
    }

    return title;
  },

  __computeHasUserTwitter: function(authUser){
    return authUser.auth.reduce((outcome, profile) => {
      if (profile.app === 'twitter') {
        return true;
      }

      return outcome;
    }, false);
  }

});

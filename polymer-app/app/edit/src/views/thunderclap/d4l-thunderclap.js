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
      value: '/thunderclap/twitter/subscribe'
    },

    __thunderclapSubscribeUrl: {
      type: String
    },
    __thunderclapSubscribeBody: {
      type: Object
    },

    __pageTitle: {
      type: String,
      value: 'Storm',
      computed: '__computePageTitle(__selectedItem)'
    },

    __campaignsQuery: {
      type: Object,
      computed: '__computeCampaignsQuery(db.campaign.data.*)'
    }
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
      campaignId: this.__campaignId,
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

  __computeCampaignsQuery: function () {
    return {
      type: {
        $eq: 'thunderclap'
      },
      status: {
        $eq: 'published'
      }
    }
  },

  __computePageTitle: function (campaign) {
    let title = 'Storm';

    this.__debug(title);

    if (campaign && campaign.name) {
      title = `${title} - ${campaign.name}`
    }

    return title;
  }

});

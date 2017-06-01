Polymer({
  is: 'd4l-thunderclap',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LViewList
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
      notify: true
    },
    campaign: {
      type: Object
    },
    campaigns: {
      type: Array
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
      value: 'Images for Labour',
      computed: '__computePageTitle(__selectedItem)'
    },

    __campaignsQuery: {
      type: Object,
      computed: '__computeCampaignsQuery(db.campaign.data.*)'
    }
  },

  __subscribeThunderclap: function(ev){
    const campaign = ev.detail;

    this.set('__thunderclapSubscribeUrl', this.get('__thunderclapTwitterUrl'));
    this.set('__thunderclapSubscribeBody', {
      campaignId: campaign.id,
      message: campaign.description
    });
  },

  __thunderclapResponse: function(res){
    // this.__debug(res);
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
    let title = 'Thunderclap';

    if (campaign && campaign.name) {
      title = `${title} - ${campaign.name}`
    }

    return title;
  }

});
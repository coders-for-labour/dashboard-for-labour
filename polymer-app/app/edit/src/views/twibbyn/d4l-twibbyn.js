Polymer({
  is: 'd4l-twibbyn',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LViewList,
    Polymer.D4LFacebook,
    Polymer.D4LShare
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
      type: Object
    },
    campaign: {
      type: Object
    },
    campaigns: {
      type: Array
    },

    __pageTitle: {
      type: String,
      value: 'Twibbyn for Labour',
      computed: '__computePageTitle(__selectedItem)'
    },

    __campaignsQuery: {
      type: Object,
      computed: '__computeCampaignsQuery(db.campaign.data.*)'
    }
  },

  __computeCampaignsQuery: function () {
    this.__silly('__computeCampaignsQuery');
    return {
      type: {
        $eq: 'twibbyn'
      },
      status: {
        $eq: 'published'
      }
    }
  },

  __computePageTitle: function (campaign) {
    let title = 'Twibbyn';

    if (campaign && campaign.name) {
      title = `${title} - ${campaign.name}`
    }

    return title;
  }

});

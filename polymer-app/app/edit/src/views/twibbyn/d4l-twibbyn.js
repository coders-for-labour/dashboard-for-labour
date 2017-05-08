Polymer({
  is: 'd4l-twibbyn',
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
      type: Object
    },
    campaign: {
      type: Object
    },
    campaigns: {
      type: Array
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
      }
    }
  }

});

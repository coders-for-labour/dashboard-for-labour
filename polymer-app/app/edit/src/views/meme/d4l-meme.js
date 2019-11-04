Polymer({
  is: 'd4l-meme',
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

  __addUserMeme: function() {
    this.__openPostDialog = true;
  },

  __saveUserMeme: function(ev) {
    this.__debug(ev);
    this.push('db.post.data', {
      ownerId: this.get('auth.user.id'),
      type: 'campaign',
      text: ev.detail.text,
      image: ev.detail.image
    });
  },

  __computeCampaignsQuery: function () {
    this.__silly('__computeCampaignsQuery');
    return {
      type: {
        $eq: 'meme'
      },
      status: {
        $eq: 'published'
      }
    }
  },

  __computePageTitle: function (campaign) {
    let title = 'Images for Labour';

    if (campaign && campaign.name) {
      title = `${title} - ${campaign.name}`
    }

    return title;
  }

});

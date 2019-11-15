Polymer({
  is: 'd4l-thunderclap',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Thunderclap.Helpers,
    Polymer.D4LViewList,
    Polymer.D4LFacebook,
    Polymer.D4LShare,
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


    __thunderclap: Array,
    __thunderclapQuery: {
      type: Object,
      computed: '__computeThunderclapQuery(db.thunderclap.data.*, __selectedItem)'
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

  __sharedTw: function() {
    this.set('__shareTwStatus', 'shared');
  },

  __sharedTwErr: function() {
    this.set('__shareTwStatus', 'ready');
  },

  __addThunderclap: function() {
    return this.addThunderclap();
  },

  __computeThunderclapQuery: function (cr) {
    return {
      __crPath: cr.path,
      scheduledExecution: {
        $gtDate: Sugar.Date.create('now')
      }
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

  __computeHasUserTwitter: function(){
    const authUser = this.get('auth.user');
    if (!authUser) return;

    return authUser.auth.reduce((outcome, profile) => {
      if (profile.app === 'twitter') {
        return true;
      }

      return outcome;
    }, false);
  }

});

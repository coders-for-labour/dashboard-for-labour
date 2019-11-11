Polymer({
  is: 'd4l-thunderclap',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
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

  __addThunderclap() {
    const dbFactory = this.get('db.Factory');
    const dialog = this.$.dialog;

    const thunderclap = dbFactory.create('thunderclap');

    const dialogInputs = {
      name: {
        label: 'Title',
        type: 'TEXT',
        default: thunderclap.name
      },
      description: {
        label: 'Description',
        type: 'TEXT',
        default: thunderclap.description
      },
      topicId: {
        label: 'Topic ID',
        type: 'TEXT',
        default: thunderclap.topicId
      },
      date: {
        label: 'Date',
        type: 'DATE',
        default: thunderclap.scheduledExecution
      },
      time: {
        label: 'Time',
        type: 'TIME',
        default: thunderclap.scheduledExecution
      },
    };

    dialog.setMetadata({
      'title': 'Thunderclap',
      'description': 'Add a new thunderclap to the system',
      'action': 'Save',
    });
    
    return dialog.openDialog(this.parseInputSchema(dialogInputs))
      .then((result) => {
        if (!result.values.name) {
          throw new Error('Thunderclap requires a name');
        }
        if (!result.values.description) {
          throw new Error('Thunderclap requires a description');
        }
        if (!result.values.date) {
          throw new Error('Thunderclap requires a date');
        }
        if (!result.values.time) {
          throw new Error('Thunderclap requires a time');
        }

        const date = Sugar.Date.create(`${result.values.date} ${result.values.time}`);
        if (!Sugar.Date.isValid(date)) {
          throw new Error('Invalid Date');
        }

        thunderclap.name = result.values.name;
        thunderclap.description = result.values.description;
        thunderclap.topicId = result.values.topicId;
        thunderclap.scheduledExecution = date;

        this.push('db.thunderclap.data', thunderclap);
      });
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
    return {
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

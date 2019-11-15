Polymer({
  is: "d4l-auth-service",
  behaviors: [
    D4L.Logging
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
      value: {
        status: 'idle',
        user: null,
        token: null,
        signedIn: false
      },
      notify: true
    }
  },
  observers: [
    '__onStatusChanged(auth.status)'
  ],

  onAjaxResponse: function(ev, detail) {
    if (!detail.response) {
      this.set('auth.user', {
        "id": "%{D4L_BUTTRESS_PUBLIC_USER_ID}%",
        "auth": [],
        "tokens":[{
          "value": "%{D4L_BUTTRESS_PUBLIC_USER_TOKEN}%",
          "role": "public"
        }]
      });
    } else {
      this.set('auth.user', detail.response.user);
      this.set('auth.signedIn', true);
    }

    const user = this.get('auth.user');
    if (!user || !user.id) {
      return;
    }

    if (!user.tokens || user.tokens.length < 1) {
      return;
    }

    this.set('auth.token', user.tokens[0]);
    this.set('auth.status', 'done');
  },

  onAjaxError: function() {
    this.set('auth.status', 'error');
  },

  __onStatusChanged: function() {
    if (this.get('auth.status') === "begin") {
      this._generateAuthenticatedRequest();
    }
  },

  _generateAuthenticatedRequest: function() {
    this.$.authenticated.params = {
      urq: Date.now()
    };
    this.$.authenticated.generateRequest();
    this.set('auth.status', 'working');
  }
});

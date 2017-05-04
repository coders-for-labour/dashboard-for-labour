Polymer({
  is: "d4l-auth-service",
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    status: {
      type: String,
      value: "idle",
      notify: true,
      observer: "_onStatusChanged"
    },
    auth: {
      type: Object,
      value: {
        user: null
      },
      notify: true
    }
  },
  attached: function() {
  },

  onAjaxResponse: function(ev, detail) {
    if (!detail.response) {
      this.status = "done";
      return;
    }
    this.auth.user = detail.response.user;
    this.notifyPath('auth.user', this.auth.user);
    this.status = "done";
  },

  onAjaxError: function() {
    this.status = "error";
  },

  _onStatusChanged: function() {
    this.__debug(`auth:${this.status}`);
    if (this.status === "begin") {
      this._generateAuthenticatedRequest();
    }
  },

  _generateAuthenticatedRequest: function() {
    this.$.authenticated.params = {
      urq: Date.now()
    };
    this.$.authenticated.generateRequest();
    this.status = "working";
  }
});

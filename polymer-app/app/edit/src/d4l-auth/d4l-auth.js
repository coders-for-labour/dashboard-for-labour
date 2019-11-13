Polymer({
  is: "d4l-auth",
  properties: {
    app: Object,

    auth: {
      type: Object,
      value: {
        user: null
      },
      notify: true
    }
  },

  loginTwitter: function() {
    location.href = "/auth/twitter";
  },
  loginFacebook: function() {
    location.href = "/auth/facebook";
  }
});

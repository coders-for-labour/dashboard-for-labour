Polymer({
  is: 'd4l-header',
  behaviors: [
    D4L.Logging,
    D4L.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    app: {
      type: Object
    },
    auth: {
      type: Object
    },
    db: {
      type: Object,
      notify: true
    },
    io: {
      type: Object
    },
    mode: {
      type: String,
      value: 'detail'
    },
    page: {
      type: String,
      observer: '__page'
    },
    pageTitle: {
      type: String
    },
    responsivePageTitle: {
      type: String,
      computed: '__computeResponsivePageTitle(pageTitle, app.title)'
    },
    pageMode: {
      type: String
    },
    header: {
      type: Object,
      notify: true
    },
    allowBack: {
      type: Boolean,
      value: false
    },
    isMobile: {
      type: Boolean,
      value: false
    },
    __userImage: {
      type: String,
      computed: '__computeUserImage(auth.user.person.avatar)'
    }
  },

  observers: [
  ],

  __page: function() {
    Polymer.updateStyles();
  },

  __viewHome: function(){
    this.fire('view-entity', '/');
  },

  __back: function() {
    this.fire('back-button-clicked');
  },

  __computeResponsivePageTitle: function(title) {
    const defaultTitle = this.get('app.title');
    if (!title) return defaultTitle;
    return title;
  },

  __computeUserImage: function(image){
    const imageSize = /_normal/i;
    if (!image) {
      return;
    }

    return image.replace(imageSize, '');
  }

});

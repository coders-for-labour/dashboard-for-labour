Polymer({
  is: 'd4l-header',
  behaviors: [
    D4L.Logging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    auth: {
      type: Object
    },
    db: {
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
      computed: '__computeResponsivePageTitle(pageTitle, isMobile)'
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

  __computeResponsivePageTitle: function(title, isMobile) {
    return !isMobile ? Sugar.String.truncate(title, 35) : Sugar.String.truncate(title, 17);
  },

  __computeUserImage: function(image){
    const imageSize = /_normal/i;
    if (!image) {
      return;
    }

    return image.replace(imageSize, '');
  }

});

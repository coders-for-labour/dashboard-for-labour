Polymer({
  is: 'd4l-twibbyn-overlay',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    image: {
      type: String
    },
    __originalImage: {
      type: String,
      computed: '__computeOriginalImage(image)'
    },
    twibbyn:{
      type: String,
      value: null
    },
    __hasTwibbyn: {
      type: Boolean,
      notify: true,
      computed: '__computeHasTwibbyn(twibbyn)'
    },
    __twibbynEndpoint: {
      type: String,
      value: '//%{D4L_CDN_URL}%'
    },
    __twibbynImage: {
      type: String,
      computed: '__computeTwibbynImage(twibbyn, __twibbynEndpoint)'
    },
    __positions: {
      type: Array,
      value: function() { return []; }
    },
    __hasLoaded: {
      type: Boolean,
    },
    position: {
      type: String,
      value: 'center',
      notify: true
    },
    square: {
      type: Boolean,
      computed: '__computeSquare(image, __hasLoaded)',
      notify: true
    }
  },

  __onTap: function() {
    if (this.square === true) {
      return;
    }


    if (!this.__positions.length) {
      let aspect = this.$.srcImage.width / this.$.srcImage.height;
      if (aspect < 1) {
        this.__positions = [
          'top',
          'center',
          'bottom'
        ];
      } else {
        this.__positions = [
          'left',
          'center',
          'right'
        ];
      }
    }

    this.set('position', this.__positions.shift());
  },

  __computeOriginalImage: function(image){
    const imageSize = /_normal/i;

    this.__silly(image);
    return image.replace(imageSize, '');
  },

  __computeTwibbynImage: function(twibbyn, endpoint){
    if (!twibbyn) {
      return '';
    }

    return `${endpoint}/${twibbyn}`;
  },

  __computeHasTwibbyn: function(twibbyn) {
    return twibbyn ? true : false;
  },

  __srcLoaded: function() {
    this.__hasLoaded = true;
    this.__debug('Image Loaded');
  },

  __computeSquare: function() {
    let aspect = this.$.srcImage.width / this.$.srcImage.height;
    this.__debug(`Image Aspect: ${aspect}: ${aspect > .99 && aspect < 1.01}`);

    return aspect > .99 && aspect < 1.01;
  }


});

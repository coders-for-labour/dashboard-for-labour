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
      value: 'http://cdn.forlabour.com/'
    },
    __twibbynImage: {
      type: String,
      computed: '__computeTwibbynImage(twibbyn)'
    }
  },

  __computeOriginalImage: function(image){
    const imageSize = /_normal/i;
    return image.replace(imageSize, '');
  },

  __computeTwibbynImage: function(twibbyn){
    if (!twibbyn) {
      return null;
    }

    return `${this.get('__twibbynEndpoint')}${twibbyn}`;
  },

  __computeHasTwibbyn: function(twibbyn) {
    return (twibbyn);
  }
});
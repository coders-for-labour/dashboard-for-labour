
Polymer({
  is: 'd4l-issue',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    Polymer.D4LViewList
  ],
  properties: {
    db: {
      type: Object
    },

    __pageTitle: {
      type: String,
      value: 'Issues'
    },

    __hasSelectedItem: {
      type: Boolean,
      value: false,
      computed: 'computeIsSet(__selectedItem)'
    }
  }
});
Polymer({
  is: 'd4l-topic-card',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Topic.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    topic: {
      type: Object
    },
    parent: Object,
    __parentQuery: {
      type: Object,
      computed: '__computeParentQuery(topic, db.topic.data.*)'
    },
    __isTopicEditor: {
      type: Boolean,
      value: false,
      computed: '__computeIsTopicEditor(topic, parent, auth.token)'
    },
    __topicSummary: {
      type: String,
      value: '',
      computed: '__computeTopicSummary(topic, topic.description)'
    },
    __viewCount: {
      type: Number,
      value: 0,
      computed: '__computeViewCount(topic, topic.viewCount)'
    }
  },

  __viewTopic: function() {
    this.viewTopic(this.get('topic.id'));
  },
  __updateTopic: function() {
    this.updateTopic(this.get('topic'));
  },

  __computeTopicSummary: function() {
    const topic = this.get('topic');
    if (!topic || !topic.description) return '';
    return Sugar.String.truncate(topic.description, 140);
  },

  __computeViewCount: function(){
    this.__silly(this.get('topic'));

    const count = this.get('topic.viewCount');
    if (!count) return 0;
    return count;
  }
});
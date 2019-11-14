
Polymer({
  is: 'd4l-issue',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Topic.Helpers,
    D4L.Issue.Helpers,
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

    topic: Object,
    __topicQuery: {
      type: Object,
      computed: '__computeTopicQuery(__selectedItem, db.issue.data.*. db.topic.data.*)'
    },

    __isTopicEditor: {
      type: Boolean,
      value: false,
      computed: '__computeIsTopicEditor(topic, auth.token)'
    },

    __hasSelectedItem: {
      type: Boolean,
      value: false,
      computed: 'computeIsSet(__selectedItem)'
    }
  },

  __formatEventDate(eventDate) {
    return Sugar.Date.format(Sugar.Date.create(eventDate), "{do} {Month}, {hours}:{minutes}{tt}");
  },

  __viewTopic() {
    this.viewTopic(this.get('__selectedItem.topicId'));
  },
  __computeTopicQuery() {
    const issue = this.get('__selectedItem');
    this.__debug(`__computeTopicQuery`, issue);
    if (!issue) return null;
    return {
      id: {
        $eq: issue.topicId
      }
    };
  },
  __sortEvents(a, b) {
    if(a.createdAt > b.createdAt) return -1;
    if(a.createdAt < b.createdAt) return 1;
    return 0;
  }
});
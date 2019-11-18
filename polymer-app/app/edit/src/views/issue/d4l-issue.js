
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
    logLevel: {
      type: Number,
      value: 3
    },

    db: {
      type: Object,
      notify: true
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

  // listeners: {
  //   'drop': '__onDrop',
  //   'dragover': '__onDragOver'
  // },

  // __onDrop(ev) {
  //   ev.preventDefault();

  //   this.__debug(`__onDrop`);
  //   let files = ev.dataTransfer.items ? ev.dataTransfer.items : false;

  //   if (files !== false) {
  //     for (let x=0; x<files.length; x++) {
  //       const f = files[x];
  //       if (f.kind !== 'file') continue;
  //       const file = f.getAsFile();
  //       this.__debug(file.name, file);
  //     }
  //   } else {
  //     files = ev.dataTransfer.files ? ev.dataTransfer.files : false;

  //   }

  // },

  // __onDragOver(ev) {
  //   ev.preventDefault();
  // },

  __linkUpdated(ev) {
    const link = ev.model.get('item');
    const issueIdx = this.get('db.issue.data').findIndex(i => i.id === this.get('__selectedItem.id'));
    const issue = this.get(`db.issue.data.${issueIdx}`);
    this.__debug(`__linkUpdated`, ev, issue);

    issue.events.forEach((e, idx) => {
      const src = e.source.links.findIndex(l => l === link);
      const res = e.response.links.findIndex(l => l === link);
      if (src !== -1) {
        this.__debug(`__linkUpdated: Source Link ${src} on Event ${idx}`, `db.issue.data.${issueIdx}.events.${idx}.source.${src}`);
        this.set(`db.issue.data.${issueIdx}.events.${idx}.source.links.${src}`, ev.detail.linkId);
      }
      if (res !== -1) {
        this.__debug(`__linkUpdated: Response Link ${res} on Event ${idx}`);
        this.set(`db.issue.data.${issueIdx}.events.${idx}.response.links.${src}`, ev.detail.linkId);
      }
    })
  },

  __addResource() {
    const issue = this.get('__selectedItem');
    const resource = this.get('db.Factory').create('resource');
    resource.issueId = issue.id;

    this.addResource(resource);
  },

  __updateIssue() {
    this.updateIssue(this.get('__selectedItem'));
  },

  __formatEventDate(eventDate) {
    return Sugar.Date.format(Sugar.Date.create(eventDate), "{do} {Month}, {hours}:{mm}{tt}");
  },

  __computeHasResponce(response) {
    return (response.description !== '' || response.links.length > 0);
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
    const sA = Sugar.Date.create(a.createdAt);
    if(Sugar.Date.isBefore(sA, b.createdAt)) return 1;
    if(Sugar.Date.isAfter(sA, b.createdAt)) return -1;
    return 0;
  }
});

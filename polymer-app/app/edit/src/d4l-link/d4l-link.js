Polymer({
  is: 'd4l-link',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
 		D4L.Issue.Helpers,
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    db: {
      type: Object,
      notify: true,
    },
    linkId: {
      type: String,
    },
    link: {
    	type: Object
    },
    __linkQuery: {
    	type: Object,
    	computed: '__computeLinkQuery(linkId, db.link.data.*)'
    }
  },
  observers: [
  	'__linkChanged(link)'
  ],
  listeners: {
  	'click': '__onClick'
  },

  __onClick(ev) {
  	this.__debug(ev);
  	const link = this.get('link');
  	if (!link) return;
  	window.open(link.uri);
  },

  __linkChanged(link) {
  	const loaded = this.get('db.link.loaded');
  	this.__debug(`__linkChanged`, loaded, link);
  	if (!loaded) return;

  	let linkId = this.get('linkId');
  	if (!link && /^https?:\/\//.test(linkId)) {
  		this.__debug(linkId);
  		linkId = this.__addLink(linkId);
  		this.fire('link-updated', {linkId: linkId});
  		return;
  	}
  	if (link.og && link.og.title) return;
  	this.__refreshLinkData(this.get('linkId'));
  },

  __computeLinkQuery(linkId, cr) {
  	this.__debug(`__computeLinkQuery`, linkId);

  	return {
  		__crPath: cr.path,
  		id: {
				$eq: linkId
  	  }
  	}
  },

  __addLink(url) {
  	this.__debug(`__addLink`, url);

    const dbFactory = this.get('db.Factory');
    const link = dbFactory.create('link');
    link.uri = url;
    this.push(`db.link.data`, link);
    return link.id
  },

  __refreshLinkData(linkId) {
  	this.__debug(`__refreshLinkData`, linkId);

	  return this.$.ajax.send({
	    url: '/api/v1/link',
	    method: 'GET',
	    contentType: 'application/json',
	    params: {
	      linkId: linkId
	    }
	  });
	}

});
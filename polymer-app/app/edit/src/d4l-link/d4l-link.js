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
		linkChangeUpdate: {
			type: Boolean,
			value: false
		},
    __linkQuery: {
    	type: Object,
    	computed: '__computeLinkQuery(linkId, db.link.data.*)'
    },
    linkLoaded: {
    	type: Boolean,
    	computed: '__computeLinkLoaded(link, link.type, link.updatedAt)'
    },
    linkTypeArticle: {
    	type: Boolean,
    	computed: '__computeLinkTypeArticle(link, link.type)'
    },
    linkTypeImage: {
    	type: Boolean,
    	computed: '__computeLinkTypeImage(link, link.type)'
    },
    linkTypeDocument: {
    	type: Boolean,
    	computed: '__computeLinkTypeDocument(link, link.type)'
    }
  },
  observers: [
  	'__linkChanged(link, linkChangeUpdate)'
  ],

  __computeLinkLoaded(link) {
  	if (!link) return false;
  	if (link.type === 'article' && !link.og.title) return false;
  	return true;
  },

  __computeLinkTypeArticle(link, linkType) {
  	this.__debug(`__computeLinkTypeArticle`, linkType === 'article');
  	return link && linkType === 'article';
  },
  __computeLinkTypeImage(link, linkType) {
  	this.__debug(`__computeLinkTypeImage`, linkType === 'image');
  	return link && linkType === 'image';
  },
  __computeLinkTypeDocument(link, linkType) {
  	this.__debug(`__computeLinkTypeDocument`, linkType === 'document');
  	return link && linkType === 'document';
  },

  __linkChanged(link) {
		if (!this.get('linkChangeUpdate') || !link) return;
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
  	if (link.type !== 'article') return;
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
Polymer({
  is: "d4l-data-service",
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    auth: {
      type: Object,
      value: {
        user: null
      }
    },
    status: {
      type: String,
      value: '',
      notify: true,
    },
    route: {
      type: String,
      value: ''
    },
    data: {
      type: Array,
      value: function() { return []; },
      notify: true
    },
    metadata: {
      type: Object,
      value: function() { return {}; },
      notify: true
    },
    liveData: {
      type: Array,
      value: []
    },
    readOnly: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },
    urlPrefix: {
      type: String,
      value: function() {
        return '';
      }
    },
    vectorBaseUrl: {
      type: String,
      computed: "__computeVectorBaseUrl(urlPrefix, route)"
    },
    scalarBaseUrl: {
      type: String,
      computed: "__computeScalarBaseUrl(urlPrefix, route, rqEntityId)"
    },
    requestQueue: {
      type: Array,
      value: function () {
        return [];
      }
    },
    request: {
      type: Object,
      value: {
        url: this.vectorBaseUrl,
        contentType: '',
        response: [],
        entityId: '',
        body: {}
      }
    },
    rqEntityId: String,
    rqUrl: String,
    rqContentType: String,
    rqParams: {},
    rqBody: {},
    rqResponse: []
  },
  observers: [
    '__dataSplices(data.splices)',
    '__dataChanges(data.*)',
    '__metadataChanged(metadata.*)',
    '__auth(route, auth.user)'
  ],

  __auth: function() {
    this.__silly(`data:${this.route}:${this.status}`);

    if (!this.get('auth.user')) {
      return;
    }

    if (this.status === "uninitialised") {
      this.__generateListRequest();
    }
  },

  /**
   * Used to generate Add and Remove requests
   * @param {Object} cr - data needed to calculate what has changed
   * @private
   */
  __dataSplices: function(cr) {
    if (!cr || this.readOnly) {
      return;
    }
    this.__debug('__dataSplices', cr);

    cr.indexSplices.forEach(i => {
      let o = i.object[i.index];
      if (i.addedCount > 0 && o.__readonly__ !== true) {
        this.__generateAddRequest(o);
      }

      // i.object.forEach((a, idx) => {
      //   this.__generateAddRequest(this.get(`data.${idx}`));
      // });

      i.removed.forEach(r => {
        if (!r.__readonly__) {
          this.__generateRmRequest(r.id);
        }
      });
    });
  },

  /**
   * Used to update individual records
   * @param {Object} cr - definition of what's changed
   * @private
   */
  __dataChanges: function(cr) {
    // this.__debug(`Internal Change: ${this.__internalChange}`);
    if (this.__internalChange__) {
      delete this.__internalChange__;
      return;
    }
    if (/\.length$/.test(cr.path) === true
        || this.readOnly) {
      return;
    }

    this.__silly('__dataChanges: ', cr);
    // Ignore mutations on the whole array
    // if (cr.base.length !== 1) {
    //   return;
    // }

    // ignore paths with fields with __ as prefix and suffix
    if (/__(\w+)__/.test(cr.path)) {
      this.__warn(`Ignoring internal change: ${cr.path}`);
      return;
    }

    let path = cr.path.split('.');
    // Is this an array mutation?
    if (/\.splices$/.test(cr.path) === true) {
      if (path.length < 4) {
        this.__warn('Ignoring path too short:', path);
        return;
      }

      let entity = this.get(path.slice(0,2));
      // let index = path[1].replace('#', '');
      // if (!cr.base[index]) {
      //   this.__warn(`Ignoring: invalid change index: ${index}`);
      //   return;
      // }
      // let entity = cr.base[index];

      // Ignore a one-off readonly change (remove the field afterwards)
      if (entity.__readOnlyChange__) {
        this.__warn(`Ignoring readonly change: ${cr.path}`);
        delete entity.__readOnlyChange__;
        return;
      }

      this.__warn('Child array mutation', cr);

      this.__silly('Key Splices: ', cr.value.indexSplices.length);

      cr.value.indexSplices.forEach(i => {
        let o = i.object[i.index];
        if (i.addedCount > 0) {
          path.splice(0,2);
          path.splice(-1,1);
          // this.__warn('Update request', entity.id, path.join('.'), cr.value);
          this.__generateUpdateRequest(entity.id, path.join('.'), o);
        } else if (i.removed.length > 0){
          if(i.removed.length > 1) {
            this.__warn('Index splice removed.length > 1', i.removed);
          } else {
            path.splice(0, 2);
            path.splice(-1, 1);
            path.push(i.index);
            path.push('__remove__');

            this.__generateUpdateRequest(entity.id, path.join('.'), '');
          }
        }
      });

      if (cr.value.indexSplices.length || !cr.value.keySplices) {
        return;
      }

      this.__silly('Key Splices: ', cr.value.keySplices.length);

      cr.value.keySplices.forEach((k, idx) => {
        k.removed.forEach(() => {
          let itemIndex = cr.value.indexSplices[idx].index;
          this.__debug(itemIndex);

          path.splice(0, 2); // drop the prefix
          path.splice(-1, 1); // drop the .splices
          path.push(itemIndex); // add the correct index

          // path.push(k.replace('#', ''));
          path.push('__remove__'); // add the remove command
          this.__generateUpdateRequest(entity.id, path.join('.'), '');
        });
      });
    } else {
      if (path.length < 3) {
        // this.__warn('Ignoring path too short:', path);
        return;
      }
      let entity = this.get(path.slice(0,2));

      // let index = path[1].replace('#', '');
      if (!entity) {
        this.__warn(`Ignoring: invalid change index: ${path.slice(0,2)}`);
        return;
      }

      // let entity = cr.base[index];
      // Ignore a one-off readonly change (remove the field afterwards)
      if (entity.__readOnlyChange__) {
        this.__warn(`Ignoring readonly change: ${cr.path}`);
        delete entity.__readOnlyChange__;
        return;
      }

      let pathPrefix = path.splice(0, 2).join('.');
      path.forEach((p, idx) => {
        const rex = /^#\d+$/;
        // Is this an assignment directly into an array item?
        if (rex.test(p)) {
          // Grab the base array
          let arr = this.get(pathPrefix);
          // Get the item
          let item = this.get(`${pathPrefix}.${p}`);
          // Replace the 'opaque key' with the correct array index
          path[idx] = arr.indexOf(item);
        }
        pathPrefix += `.${p}`;
      });

      // path.splice(0,2);

      // let tail = path[path.length-1];
      // const rex = /#\d+$/;
      // // Is this an assignment directly into an array item?
      // if (rex.test(tail)) {
      //   // Look up the item
      //   let item = this.get(path);
      //   // Grab the base array
      //   let arr = this.get(path.slice(0,-1));
      //   // Replace the 'opaque key' with the correct array index
      //   path[path.length-1] = arr.indexOf(item);
      // }


      // this.__warn('Update request', entity.id, path.join('.'), cr.value);
      this.__generateUpdateRequest(entity.id, path.join('.'), cr.value);
    }
  },

  __metadataChanged: function(cr) {
    if (this.__internalChange__) {
      this.__silly(`Ignoring internal metadata change: ${cr.path}`);
      delete this.__internalChange__;
      return;
    }

    if (/\.length$/.test(cr.path) === true
      || this.readOnly) {
      this.__debug('Ignoring .length or readOnly change');
      return;
    }

    // ignore paths with fields with __ as prefix and suffix
    let matches = /^metadata.([0-9a-fA-F]+)/.exec(cr.path);
    if (!matches) {
      this.__debug(`Ignoring invalid metadata path: ${cr.path}`);
      return;
    }
    let entityId = matches[1];
    this.__debug('__metadataChange', cr);
    if (cr.base.__readOnlyChange__) {
      delete cr.base.__readOnlyChange__;
      this.__warn(`Ignoring read only change`);
      return;
    }

    if (cr.value.__populate__) {
      this.__warn(`Populating metadata for ${entityId}`);
      delete cr.value.__populate__;
      this.__generateMetadataGetAllRequest(entityId, cr.value);
      return;
    }

    // ignore paths with fields with __ as prefix and suffix
    if (/__(\w+)__/.test(cr.path)) {
      this.__warn(`Ignoring internal change: ${cr.path}`);
      return;
    }

    this.__info('__metadataChanged', cr);
    let path = cr.path.split('.');
    // Is this an array mutation?
    if (/\.splices$/.test(cr.path) === true) {
      let remotePath = path.concat();
      remotePath.splice(-1,1);
      let base = this.get(remotePath);
      remotePath.splice(0,2);
      this.__assert(remotePath.length === 1); // Metadata doesn't support remote paths
      this.__generateMetadataUpdateRequest(entityId, remotePath.join('.'), base);
    } else {
      let value = cr.value;
      if (path.length > 3) {
        path = path.splice(0, 3);
        value = this.get(path);
      }
      path.splice(0,2);

      this.__assert(path.length === 1); // Metadata doesn't support remote paths
      this.__generateMetadataUpdateRequest(entityId, path[0], value);
    }
  },

  __generateMetadataGetAllRequest: function(entityId, defaults) {
    this.rqEntityId = entityId;
    let request = {
      type: 'list-metadata',
      url: `${this.scalarBaseUrl}/metadata`,
      entityId: this.rqEntityId,
      method: 'GET',
      contentType: '',
      body: {},
      defaults: defaults
    };

    this.__queueRequest(request);
  },

  __generateMetadataUpdateRequest: function(entityId, key, value) {
    this.rqEntityId = entityId;
    let request = {
      type: 'update-metadata',
      url: `${this.scalarBaseUrl}/metadata/${key}`,
      entityId: this.rqEntityId,
      method: 'POST',
      contentType: 'application/json',
      body: {
        value: JSON.stringify(value)
      }
    };

    this.__queueRequest(request);
  },

  __generateListRequest: function() {
    this.rqEntityId = -1;
    let request = {
      type: 'list',
      url: this.vectorBaseUrl,
      entityId: this.rqEntityId,
      method: 'GET',
      contentType: '',
      body: {}
    };

    this.__queueRequest(request);
  },
  __generateRmRequest: function(entityId) {
    this.__warn(`remove rq: ${entityId}`);

    this.rqEntityId = entityId;
    let request = {
      type: 'rm',
      url: this.scalarBaseUrl,
      entityId: this.rqEntityId,
      method: 'DELETE',
      contentType: '',
      body: {}
    };

    this.__queueRequest(request);
  },
  __generateAddRequest: function(entity) {
    this.__warn(`add rq: ${entity.name}`);

    this.rqEntityId = -1;
    let request = {
      type: 'add',
      url: this.vectorBaseUrl,
      entityId: this.rqEntityId,
      method: 'POST',
      contentType: 'application/json',
      body: entity
    };
    this.__queueRequest(request);
  },
  __generateUpdateRequest: function(entityId, path, value) {
    this.__warn('update rq:',entityId, path, value);

    this.rqEntityId = entityId;
    let request = {
      type: 'update',
      url: this.scalarBaseUrl,
      entityId: this.rqEntityId,
      method: 'PUT',
      contentType: 'application/json',
      body: {
        path: path,
        value: value
      }
    };
    this.__queueRequest(request);
  },

  __queueRequest: function(request) {
    this.requestQueue.push(request);
    this.__updateQueue();
  },

  __updateQueue: function() {
    if (this.requestQueue.length === 0) {
      return;
    }

    if (this.status === 'working') {
      return;
    }

    this.__generateRequest(this.requestQueue[0]);
  },

  __generateRequest: function(rq) {
    rq.response = null;
    rq.params = {
      urq: Date.now(),
      token: this.auth.user.authToken
    };

    this.__silly(rq.body);
    this.rqUrl = rq.url;
    this.rqMethod = rq.method;
    this.rqContentType = rq.contentType;
    this.rqParams = rq.params;
    this.rqBody = rq.body;

    this.$.ajaxService.generateRequest();
    this.status = 'working';
  },

  __ajaxResponse: function(ev) {
    let rq = this.requestQueue.shift();

    if (!rq) {
      this.__warn('Response on an empty requestQueue!!!');
      return;
    }

    rq.response = ev.detail.response;
    switch (rq.type) {
      default: {
        this.__warn('Unhandled rq.type', rq.type);
      } break;
      case 'list': {
        this.__ajaxListResponse(rq);
      } break;
      case 'list-metadata': {
        this.__ajaxListMetadataResponse(rq);
      } break;
      case 'update': {
        this.__ajaxUpdateResponse(rq);
      } break;
      case 'add': {
        this.__ajaxAddResponse(rq);
      } break;
    }

    this.status = 'done';
    this.__updateQueue();
  },
  __ajaxError: function() {
    this.status = 'error';
  },

  __ajaxListResponse: function(rq) {
    this.__internalChange__ = true;
    this.data = this.liveData = rq.response;
  },
  __ajaxListMetadataResponse: function(rq) {
    // this.set(['metadata',rq.entityId], rq.response);
    for (let field in rq.defaults) {
      if (!Object.prototype.hasOwnProperty.call(rq.defaults, field)) {
        continue;
      }
      this.__internalChange__ = true;
      if (rq.response[field]) {
        this.set(['metadata', rq.entityId, field], rq.response[field]);
      } else {
        this.set(['metadata', rq.entityId, field], rq.defaults[field]);
      }
    }
  },

  __ajaxAddResponse: function(rq) {
    this.data.forEach((d, idx) => {
      if (!d.id) {
        this.data[idx].__readOnlyChange__ = true;
        this.set(['data', idx, 'id'], rq.response.id);
      }
    })
  },

  __ajaxUpdateResponse: function(rq) {
    this.__debug('__ajaxUpdateResponse', rq);
    const responses = rq.response;
    responses.forEach(r => {
      if (!(r.value instanceof Object) || r.type !== 'vector-add' || !r.value.id) {
        this.__warn('update early out', r.value instanceof Object);
        return;
      }
      let idx = this.get('data').findIndex(e => e.id == rq.entityId); //eslint-disable-line eqeqeq
      if (idx === -1) {
        this.__warn('Invalid entity id', rq.entityId);
        return;
      }
      let base = this.get(['data', idx, r.path]);
      this.__debug(['data', idx, r.path], base);
      if (base instanceof Array) {
        for (let x=0; x<base.length; x++) {
          if (!base[x].id) {
            this.data[idx].__readOnlyChange__ = true;
            this.__debug(['data', idx, rq.body.path, x, 'id']);
            this.set(['data', idx, rq.body.path, x, 'id'], r.value.id);
            break;
          }
        }
      }
    });
  },

  __computeVectorBaseUrl: function(urlPrefix, route) {
    return `${urlPrefix}/${route}`
  },
  __computeScalarBaseUrl: function() {
    return `${this.urlPrefix}/${this.route}/${this.rqEntityId}`
  }
});



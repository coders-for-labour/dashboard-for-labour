/**
 * @polymerBehavior Polymer.D4LCardBehavior
 */
Polymer.D4LCardBehavior = {
  properties: {
    __showButtons: {
      type: Boolean,
      value: false
    }
  },
  listeners: {
    'mouseenter': '__mouseEnter',
    'mouseleave': '__mouseLeave'
  },

  __mouseEnter: function() {
    this.__showButtons = true;
  },
  __mouseLeave: function() {
    this.__showButtons = false;
  }
};

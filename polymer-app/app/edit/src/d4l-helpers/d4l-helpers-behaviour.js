window.D4L = window.D4L || {};

/**
 * @polymerBehavior D4L.Helpers
 */
D4L.Helpers = {
  properties: {
    
  },

  authTwitter() {
    window.location = '/auth/twitter';
  },

  inAuthRole(token, match) {
    if (!token || !token.role) return false;
    return token.role.indexOf(match) === 0;
  },

  parseInputSchema(inputSchema) {
    const inputs = [];
    Object.keys(inputSchema).forEach(key => {
      const input = Object.assign({}, inputSchema[key]);
      let value = null;

      switch(input.type) {
        case 'TEXT':
          value = '';
          break;
        case 'TEXTAREA':
          value = '';
          break;
        case 'NUMBER':
          value = 0;
          break;
        case 'TOGGLE':
          value = false;
          break;
        case 'SELECT':
          value = null;
          break;
        case 'DATE':
          value = Sugar.Date.create('now')
          break;
        case 'TIME':
          value = Sugar.Date.create('now')
          break;
      }

      if (input.default && input.type === 'DATE') {
        value = Sugar.Date.create(input.default);
      } else if (input.default) {
        value = input.default;
      }

      if (input.type === 'TOGGLE') {
        value = (value) ? true : false;
      }

      if (input.type === 'DATE') {
        value = this.computeDateFormatDate(value);
      }

      if (input.type === 'TIME') {
        value = this.computeDateFormatTime(value);
      }

      input.name = key;
      input.value = value;

      inputs.push(input);
    });

    return {
      inputs: inputs
    };
  },

  computeIsSet(value) {
    return (typeof value === 'undefined' || value === null) === false;
  },

  computeDateFormat(strDate, defaultValue = 'Not Set') {
    if (!strDate) return defaultValue;
    const date = Sugar.Date.create(strDate);
    if (!date || !Sugar.Date.isValid(date)) return defaultValue;
    return Sugar.Date.format(date, '{dd}/{MM}/{yyyy} {HH}:{mm}:{ss}');
  },
  computeDateFormatTime(strDate, defaultValue = 'Not Set') {
    if (!strDate) return defaultValue;
    const date = Sugar.Date.create(strDate);
    if (!date || !Sugar.Date.isValid(date)) return defaultValue;
    return Sugar.Date.format(date, '{HH}:{mm}:{ss}');
  },
  computeDateFormatDate(strDate, defaultValue = 'Not Set') {
    if (!strDate) return defaultValue;
    const date = Sugar.Date.create(strDate);
    if (!date || !Sugar.Date.isValid(date)) return defaultValue;
    return Sugar.Date.format(date, '{dd}/{MM}/{yyyy}');
  },
  computeDateFormatRelative(strDate, defaultValue = 'Not Set') {
    if (!strDate) return defaultValue;
    const date = Sugar.Date.create(strDate);
    if (!date || !Sugar.Date.isValid(date)) return defaultValue;
    return Sugar.Date.relative(date);
  },
};

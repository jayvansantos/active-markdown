// Generated by CoffeeScript 1.6.1
(function() {
  var BinaryVar, Executor, NumberVar, StringVar, Variable, buildBinaryVar, buildGraph, buildNumberVar, buildStringVar, executor, makeLive,
    _this = this,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $('#toggle-raw').one('click', function() {
    return setTimeout(function() {
      return $('body').append("<style>\n    #raw.visible {\n        max-height: " + ($('#raw').height()) + "px;\n    }\n</style>");
    }, 1000);
  });

  $('#toggle-raw').on('click', function() {
    return $('#raw').toggleClass('visible');
  });

  $('#reset').on('click', function() {
    return window.location.reload();
  });

  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
  };

  Executor = (function() {

    function Executor() {
      var _this = this;
      this._deferredExecute = function() {
        return Executor.prototype._deferredExecute.apply(_this, arguments);
      };
      this._variables = {};
      $('pre code').on('blur', this._deferredExecute);
    }

    Executor.prototype.getOrCreateVariable = function(attrs) {
      var name, variable_model;
      name = attrs.name;
      if (this._variables[name]) {
        variable_model = this._variables[name];
        delete attrs.value;
      } else {
        variable_model = new Backbone.Model(name);
        this._variables[name] = variable_model;
        variable_model.on('change', this._deferredExecute);
      }
      variable_model.set(attrs);
      return variable_model;
    };

    Executor.prototype._prepareState = function() {
      var state;
      state = {};
      _.each(this._variables, function(v) {
        return state[v.get('name')] = v.get('value');
      });
      return state;
    };

    Executor.prototype._compileCode = function() {
      var coffee_code_str, js_code_str;
      coffee_code_str = '';
      $('pre code').each(function(i, el) {
        return coffee_code_str += $(el).text();
      });
      console.log(coffee_code_str);
      js_code_str = CoffeeScript.compile(coffee_code_str);
      return js_code_str;
    };

    Executor.prototype._deferredExecute = function() {
      var _this = this;
      if (!this._is_executing) {
        this._is_executing = true;
        return _.defer(function() {
          var fn, js_code_str, state;
          console.log(new Date());
          state = _this._prepareState();
          console.log(state, state.some_number);
          js_code_str = _this._compileCode();
          fn = Function(js_code_str);
          fn.call(state, js_code_str);
          console.log(state);
          _this._updateVariablesFrom(state);
          return _this._is_executing = false;
        });
      }
    };

    Executor.prototype._updateVariablesFrom = function(state) {
      var k, v, _results;
      _results = [];
      for (k in state) {
        v = state[k];
        _results.push(this._variables[k].set({
          value: v
        }));
      }
      return _results;
    };

    return Executor;

  })();

  executor = new Executor();

  makeLive = function(i, el) {
    var $tag, config, live_element, name, text_content;
    $tag = $(el);
    name = $tag.data('name');
    config = $tag.data('config');
    text_content = $tag.html();
    console.log(name, config);
    if ($tag.data('graph')) {
      live_element = buildGraph(text_content, name, config);
    } else if (config.length === 3 && config[1] === 'or') {
      live_element = buildBinaryVar(text_content, name, config);
    } else if (/[[\d]+[\.]{2,3}[\d]+]/.test(config[0])) {
      live_element = buildNumberVar(text_content, name, config);
    } else {
      live_element = buildStringVar(text_content, name, config);
    }
    console.log(live_element);
    return $tag.replaceWith(live_element.render());
  };

  Variable = (function(_super) {

    __extends(Variable, _super);

    function Variable() {
      var _this = this;
      this.render = function() {
        return Variable.prototype.render.apply(_this, arguments);
      };
      return Variable.__super__.constructor.apply(this, arguments);
    }

    Variable.prototype.tagName = 'span';

    Variable.prototype.initialize = function() {
      this.listenTo(this.model, 'change', this.render);
      return this._ui_map = _.extend({}, this.ui);
    };

    Variable.prototype.render = function() {
      var name, selector, _ref;
      console.log('Variable.render');
      this.$el.html(_.template(this.template)(this.model.toJSON()));
      _ref = this._ui_map;
      for (name in _ref) {
        selector = _ref[name];
        console.log(name, selector);
        this.ui[name] = this.$el.find(selector);
      }
      console.log(this.ui);
      this.onRender();
      return this.el;
    };

    Variable.prototype.ui = {};

    Variable.prototype.onRender = function() {};

    return Variable;

  })(Backbone.NamedView);

  NumberVar = (function(_super) {

    __extends(NumberVar, _super);

    function NumberVar() {
      return NumberVar.__super__.constructor.apply(this, arguments);
    }

    NumberVar.prototype.ui = {
      range: 'input[type="range"]',
      output: 'span.output'
    };

    NumberVar.prototype.events = {
      'mouseup [type="range"]': '_update'
    };

    NumberVar.prototype._update = function() {
      console.log('update value is', this.ui, parseInt(this.ui.range.val()));
      return this.model.set({
        value: parseInt(this.ui.range.val())
      });
    };

    NumberVar.prototype.template = "<span class=\"variable-label\">{{ name }}</span>\n<input type=\"range\" min=\"{{ start }}\" max=\"{{ end }}\" value=\"{{ value }}\">\n<span class=\"output\">{{ value }}</span>";

    return NumberVar;

  })(Variable);

  buildGraph = function(text_content, name, config) {
    var $t;
    $t = $("GRAPH");
    return {
      render: function() {
        return $t;
      }
    };
  };

  buildNumberVar = function(text_content, name, config) {
    var end, number_model, start, variable_view;
    console.log('buildNumberVar');
    config = _.string.strip(config[0], '][').split('.');
    console.log('config', config);
    start = _.first(config);
    end = _.last(config);
    text_content = _.string.strip(text_content, '$%');
    number_model = executor.getOrCreateVariable({
      name: name,
      start: start,
      end: end,
      value: parseInt(text_content)
    });
    variable_view = new NumberVar({
      model: number_model
    });
    console.log(start, end);
    return variable_view;
  };

  BinaryVar = (function(_super) {

    __extends(BinaryVar, _super);

    function BinaryVar() {
      return BinaryVar.__super__.constructor.apply(this, arguments);
    }

    BinaryVar.prototype.template = "<span class=\"variable-label\">{{ name }}</span>\n<label><input class=\"option-a\" name=\"{{ name }}\" type=\"radio\" value=\"{{ a }}\">{{ a }}</label>\n<label><input class=\"option-b\" name=\"{{ name }}\" type=\"radio\" value=\"{{ b }}\">{{ b }}</label>";

    BinaryVar.prototype.onRender = function() {
      var a, b, value, _ref;
      _ref = this.model.toJSON(), value = _ref.value, a = _ref.a, b = _ref.b;
      if (value === a) {
        return this.$el.find('.option-a').attr('checked', true);
      } else if (value === b) {
        return this.$el.find('.option-b').attr('checked', true);
      }
    };

    BinaryVar.prototype.events = {
      'change input': '_update'
    };

    BinaryVar.prototype.ui = {
      'a': '.option-a',
      'b': '.option-b'
    };

    BinaryVar.prototype._update = function() {
      if (this.ui.a.is(':checked')) {
        return this.model.set('value', this.ui.a.val());
      } else if (this.ui.b.is(':checked')) {
        return this.model.set('value', this.ui.b.val());
      }
    };

    return BinaryVar;

  })(Variable);

  buildBinaryVar = function(text_content, name, config) {
    var var_model, variable_view;
    console.log('buildBinaryVar');
    var_model = executor.getOrCreateVariable({
      name: name,
      value: text_content,
      a: config[0],
      b: config[2]
    });
    variable_view = new BinaryVar({
      model: var_model
    });
    return variable_view;
  };

  StringVar = (function(_super) {

    __extends(StringVar, _super);

    function StringVar() {
      return StringVar.__super__.constructor.apply(this, arguments);
    }

    StringVar.prototype.className = 'readonly';

    StringVar.prototype.template = "<span class=\"variable-label\">{{ name }}</span>\n{{ value }}";

    return StringVar;

  })(Variable);

  buildStringVar = function(text_content, name, config) {
    var var_model, variable_view;
    var_model = executor.getOrCreateVariable({
      name: name,
      value: text_content
    });
    variable_view = new StringVar({
      model: var_model
    });
    return variable_view;
  };

  $('.live-text').each(makeLive);

  $('pre code').each(function(i, code) {
    return $(code).attr('contenteditable', true);
  });

  console.log(executor);

}).call(this);

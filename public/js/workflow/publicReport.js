var isDbug = true; function dbug() {if(isDbug){console.log.apply(console,arguments);}}


//===============================================================
// BEGIN: EMBER APPLICATION
//---------------------------------------------------------------
var App = Ember.Application.create({ LOG_TRANSITIONS: isDbug, LOG_TRANSITIONS_INTERNAL: isDbug, LOG_VIEW_LOOKUPS: isDbug });

App.Router.map(function () {
  this.route(   'index',      {path: '/'});
  this.resource('responses',  {path: '/responses'});
});

App.ApplicationRoute = Ember.Route.extend({});
App.ApplicationController = Ember.Controller.extend({});

App.IndexRoute = Ember.Route.extend({ beforeModel: function () {this.transitionTo('responses');} });
App.IndexController = Ember.Controller.extend({});

App.ResponsesRoute = Ember.Route.extend({
  sortProperties: 'created',
  sortAscending:  false,
  count:          0,  // total # of records
  limit:          25, // records per page
  page:           1,  // current page
  totalPages:     1,  // total # of pages
  actions: {
    setSortProperties: function (v) {this.sortProperties=v;                        return this.refresh();},
    setSortAscending:  function (v) {this.sortAscending=v;                         return this.refresh();},
    setPage:           function (v) {if(v>=1 && v<=this.totalPages) {this.page=v;  return this.refresh();}},
    prevPage:          function ()  {if(this.page>1)                {this.page-=1; return this.refresh();}},
    nextPage:          function ()  {if(this.page<this.totalPages)  {this.page+=1; return this.refresh();}}
  },
  model: function () {
    var self  = this;
    var sort  = {}; sort[this.sortProperties] = (this.sortAscending==='false'||!this.sortAscending)?-1:1;
    var limit = this.limit;
    var skip  = (this.page-1)*this.limit;
    return this.store.find('response', {'sort': sort, 'limit': limit, 'skip': skip}).then(
      function success(result) {self.count = (typeof result.get('meta.count') !== 'undefined') ? result.get('meta.count') : self.count; self.totalPages = Math.ceil(parseInt(self.count,10)/parseInt(self.limit,10)); return result;},
      function failure() {dbug('Failed to get responses.');}
    );
  },
  setupController: function (controller, model) {
    controller.set('sortProperties', this.sortProperties);
    controller.set('sortAscending',  this.sortAscending);
    controller.set('count',          this.count);
    controller.set('page',           this.page);
    controller.set('totalPages',     this.totalPages);
    controller.set('model',          model);
  }
});

App.ResponsesController = Ember.ArrayController.extend({
  sortProperties: null,
  sortAscending:  null,
  count:          null,
  limit:          null,
  page:           null,
  totalPages:     null,
  sortAscendingString: function (key, value, previousValue) {
    /*set*/ if(arguments.length > 1) {this.set('sortAscending',((value==='false'||!value)?false:true));}
    /*get*/ return (this.get('sortAscending')==='false'||!this.get('sortAscending'))?'false':'true';
  }.property('sortAscending'),
  uniqueAnswerSlugs: function () {
    var result = [];
    this.get('content').forEach(function (response) {
      response.get('answers').forEach(function (answer) {
        var answerSlug = answer.get('slug');
        if(result.indexOf(answerSlug) === -1) {result.push(answerSlug);}
      });
    });
    return result;
  }.property('content.@each.answers')
});

App.ResponsesSortPropertiesSelectView = Ember.Select.extend({
  controller: null,
  prompt: 'Sort By...',
  content: [
    {label: 'Created',           value: 'created'},
    {label: 'IP Address',        value: 'ipAddress'},
    {label: 'Agent',             value: 'agent'},
    {label: 'Operating System',  value: 'operatingSystem'},
    {label: 'Device',            value: 'device'},
    {label: 'Screen Resolution', value: 'screenResolution'},
    {label: 'Referrer',          value: 'referrer'}
  ],
  optionLabelPath: 'content.label',
  optionValuePath: 'content.value',
  value: null,
  eventManager: Ember.Object.create({
    change: function (event, view) {if(typeof event.target.value !== 'undefined' && event.target.value !== '') {return view.get('controller').send('setSortProperties',event.target.value);}}
  })
});

App.ResponsesSortAscendingSelectView = Ember.Select.extend({
  controller: null,
  prompt: 'Sort Order...',
  content: [
    {label: 'Ascending',  value: 'true'},
    {label: 'Descending', value: 'false'}
  ],
  optionLabelPath: 'content.label',
  optionValuePath: 'content.value',
  value: null,
  eventManager: Ember.Object.create({
    change: function (event, view) {if(typeof event.target.value !== 'undefined' && event.target.value !== '') {return view.get('controller').send('setSortAscending',((event.target.value==='false'||!event.target.value)?false:true));}}
  })
});

App.MappedAnswersComponent = Ember.Component.extend({
  tagName: '',
  answerSlugs: [],
  answers: [],
  result: function () {
    var cmpt = this;
    return cmpt.get('answerSlugs').map(function (item, index, enumerable) {
      var mappedAnswer = null;
      cmpt.get('answers').forEach(function (answer) {if(item === answer.get('slug')) {mappedAnswer = answer;}});
      return mappedAnswer;
    });
  }.property('answerSlugs','answers')
});
//---------------------------------------------------------------
// END: EMBER APPLICATION
//===============================================================


//===============================================================
// BEGIN: EMBER DATA
//---------------------------------------------------------------
App.ApplicationSerializer = DS.RESTSerializer.extend({
  primaryKey: '_id',
  extract: function (store, type, payload, id, requestType) {
    if(typeof payload !== 'undefined' && typeof payload.meta !== 'undefined' && typeof payload.meta._csrf !== 'undefined') {
      $('meta[name="csrf-token"]').attr('content', payload.meta._csrf);
    }
    return this._super(store, type, payload, id, requestType);
  },
  normalize: function (type, hash, prop) {
    if(typeof hash !== 'undefined' && typeof hash.__v !== 'undefined') {delete hash.__v;}
    return this._super(type, hash, prop);
  },
  serializeHasMany: function (record, json, relationship) {
    var key = relationship.key;
    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);
    if(relationshipType === 'manyToNone' || relationshipType === 'manyToMany' || relationshipType === 'manyToOne') {
      json[key] = Ember.get(record, key).mapBy('id');
    }
  }
});
App.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: window.location.pathname.slice(1)+(window.location.pathname.slice(-1)!=='/'?'/':'')+'api/v1',
  defaultSerializer: '-default',
  headers: {'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')}
});

App.Answer = DS.Model.extend({
  slug:  DS.attr('string'),
  value: DS.attr('string')
});
App.AnswerSerializer = App.ApplicationSerializer.extend({});

App.Response = DS.Model.extend({
  survey:           DS.attr('string'),
  answers:          DS.hasMany('answer'),
  created:          DS.attr('date', {defaultValue: function() {return new Date();}}),
  ipAddress:        DS.attr('string'),
  agent:            DS.attr('string'),
  operatingSystem:  DS.attr('string'),
  device:           DS.attr('string'),
  screenResolution: DS.attr('string'),
  referrer:         DS.attr('string')
});
App.ResponseSerializer = App.ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {attrs: {answers: {embedded: 'always'}}});
//---------------------------------------------------------------
// END: EMBER DATA
//===============================================================

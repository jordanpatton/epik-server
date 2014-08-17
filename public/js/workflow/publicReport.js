var isDbug = true; function dbug() {if(isDbug){console.log.apply(console,arguments);}}


//===============================================================
// BEGIN: EMBER APPLICATION
//---------------------------------------------------------------
var App = Ember.Application.create({ LOG_TRANSITIONS: isDbug });

App.Router.map(function () {
  this.route(   'index',      {path: '/'});
  this.resource('responses',  {path: '/responses'});
});

App.ApplicationRoute = Ember.Route.extend({});
App.ApplicationController = Ember.Controller.extend({});

App.IndexRoute = Ember.Route.extend({ beforeModel: function () {this.transitionTo('responses');} });
App.IndexController = Ember.Controller.extend({});

App.ResponsesRoute = Ember.Route.extend({
  page: 1,
  totalPages: 5,
  actions: {
    setPage:  function (i) {if(i>=1 && i<=this.totalPages) {this.page=i;  return this.refresh();}},
    prevPage: function ()  {if(this.page>1)                {this.page-=1; return this.refresh();}},
    nextPage: function ()  {if(this.page<this.totalPages)  {this.page+=1; return this.refresh();}}
  },
  model: function () {return this.store.find('response', {page: this.page});},
  setupController: function (controller, model) {
    controller.set('page', this.page);
    controller.set('totalPages', this.totalPages);
    controller.set('model', model);
  }
});
App.ResponsesController = Ember.ArrayController.extend({
  sortProperties: ['created'],
  sortAscending: false,
  count: function () {return this.get('length');}.property('length'),
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

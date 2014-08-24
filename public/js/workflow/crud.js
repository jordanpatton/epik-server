var isDbug = true; function dbug() {if(isDbug){console.log.apply(console,arguments);}}


//...............................................................
// HANDLEBARS
Ember.Handlebars.registerBoundHelper('getFullYear', function (value) {
  return (new Date(value)).getFullYear();
});
//...............................................................


//===============================================================
// BEGIN: EMBER APPLICATION
//---------------------------------------------------------------
// SETUP (APPLICATION NAMESPACE)
var App = Ember.Application.create({ LOG_TRANSITIONS: isDbug, LOG_TRANSITIONS_INTERNAL: isDbug, LOG_VIEW_LOOKUPS: isDbug });

//---------------------------------------------------------------
// ROUTER
App.Router.map(function () {
  this.route(   'index',      {path: '/'});
  this.resource('surveys',    {path: '/surveys'}, function () {
    this.route(   'index',    {path:         '/'});
    this.route(   'new',      {path:         '/new'});
    this.resource('survey',   {path:         '/:survey_id'}, function () {
      this.route(   'index',  {path:                    '/'});
      this.route(   'edit',   {path:                    '/edit'});
    });
  });
  this.resource('responses',  {path: '/responses'}, function () {
    this.route(   'index',    {path:           '/'});
    this.route(   'new',      {path:           '/new'});
    this.resource('response', {path:           '/:response_id'}, function () {
      this.route(   'index',  {path:                        '/'});
      this.route(   'edit',   {path:                        '/edit'});
    });
  });
});
App.Router.reopen({rootURL: '/workflow/crud/'});

//---------------------------------------------------------------
// ROUTES (HAVE MODELS >> CONTROLLERS >> TEMPLATES)
// Application
App.ApplicationRoute = Ember.Route.extend({});
App.ApplicationController = Ember.Controller.extend({
  title: 'Epik',
  currentYear: function () {return (new Date()).getFullYear();}.property()
});
// (Application)Index
App.IndexRoute = Ember.Route.extend({});
App.IndexController = Ember.Controller.extend({
  title: 'CRUD',
  timestamp: function () {return (new Date()).toDateString();}.property()
});

//...............................................................
// Surveys
App.SurveysRoute = Ember.Route.extend({ model: function () {return this.store.findAll('survey');} });
App.SurveysController = Ember.ArrayController.extend({
  sortProperties: ['title'],
  sortAscending: true,
  count: function () {return this.get('length');}.property('length')
});
// SurveysIndex
App.SurveysIndexRoute = Ember.Route.extend({ model: function () {return this.modelFor('surveys');} });
App.SurveysIndexController = Ember.ArrayController.extend({});
// SurveysNew
App.SurveysNewRoute = Ember.Route.extend({
  model: function () {return this.store.createRecord('survey');},
  actions: {
    willTransition: function (transition) {
      if(this.currentModel.get('isNew')) {
        if(confirm('Abandon progress?')) {this.currentModel.destroyRecord();}
        else                             {transition.abort();}
      }
    }
  }
});
App.SurveysNewController = Ember.ObjectController.extend({
  actions: {
    create: function () {
      var ctrl = this;
      var modl = this.get('model');
      modl.save().then(
        function success() {ctrl.transitionToRoute('survey.index', modl.get('id'));},
        function failure() {dbug('Failed to create survey.');}
      );
    }
  }
});
//...............................................................
// Survey
App.SurveyRoute = Ember.Route.extend({ model: function (params) {return this.store.find('survey', params.survey_id);} });
App.SurveyController = Ember.ObjectController.extend({});
// SurveyIndex
App.SurveyIndexRoute = Ember.Route.extend({ model: function () {return this.modelFor('survey');} });
App.SurveyIndexController = Ember.ObjectController.extend({});
// SurveyEdit
App.SurveyEditRoute = Ember.Route.extend({ model: function () {return this.modelFor('survey');} });
App.SurveyEditController = Ember.ObjectController.extend({
  actions: {
    delete: function () {
      var ctrl = this;
      var modl = this.get('model');
      modl.destroyRecord().then(
        function success() {ctrl.transitionToRoute('surveys.index');},
        function failure() {dbug('Failed to delete survey.');}
      );
    },
    update: function () {
      var ctrl = this;
      var modl = this.get('model');
      modl.save().then(
        function success() {ctrl.transitionToRoute('survey.index', modl.get('id'));},
        function failure() {dbug('Failed to update survey.');}
      );
    }
  }
});
// SurveyFields (Component)
App.SurveyFieldsComponent = Ember.Component.extend({
  store: null,
  survey: null,
  validQuestionTypes: ['color','date','datetime','datetime-local','email','hidden','month','number','range','search','tel','text','textarea','time','url','week','other'],
  actions: {
    addQuestion: function () {
      var store  = this.get('targetObject.store');
      var survey = this.get('survey');
      if(typeof store !== 'undefined') {
        var tempQuestion = store.createRecord('question'); survey.get('questions').pushObject(tempQuestion);
        survey.save().then(
          function success() {survey.get('questions').removeObject(tempQuestion); tempQuestion.deleteRecord();},
          function failure() {dbug('Failed to create question.');}
        );
      }
    },
    removeQuestion: function (question) {
      var store  = this.get('targetObject.store');
      var survey = this.get('survey');
      if(typeof store !== 'undefined') {
        survey.get('questions').removeObject(question); question.deleteRecord();
        survey.save().then(
          function success() {/*transitionToRoute*/},
          function failure() {dbug('Failed to delete question.');}
        );
      }
    }
  }
});

//...............................................................
// Responses
App.ResponsesRoute = Ember.Route.extend({ model: function () {return this.store.findAll('response');} });
App.ResponsesController = Ember.ArrayController.extend({
  sortProperties: ['id'],
  sortAscending: true,
  count: function () {return this.get('length');}.property('length')
});
// ResponsesIndex
App.ResponsesIndexRoute = Ember.Route.extend({ model: function () {return this.modelFor('responses');} });
App.ResponsesIndexController = Ember.ArrayController.extend({});
// ResponsesNew
App.ResponsesNewRoute = Ember.Route.extend({
  model: function () {return Ember.RSVP.hash({response: this.store.createRecord('response'), validSurveys: this.store.findAll('survey')});},
  setupController: function (controller, model) {controller.set('model', model.response); controller.set('validSurveys', model.validSurveys);},
  actions: {
    willTransition: function (transition) {
      if(this.currentModel.response.get('isNew')) {
        if(confirm('Abandon progress?')) {this.currentModel.response.destroyRecord();}
        else                             {transition.abort();}
      }
    }
  }
});
App.ResponsesNewController = Ember.ObjectController.extend({
  validSurveys: [],
  actions: {
    create: function () {
      var ctrl = this;
      var modl = this.get('model');
      modl.save().then(
        function success() {ctrl.transitionToRoute('response.index', modl.get('id'));},
        function failure() {dbug('Failed to create response.');}
      );
    }
  }
});
//...............................................................
// Response
App.ResponseRoute = Ember.Route.extend({ model: function (params) {return this.store.find('response', params.response_id);} });
App.ResponseController = Ember.ObjectController.extend({});
// ResponseIndex
App.ResponseIndexRoute = Ember.Route.extend({
  model: function () {return Ember.RSVP.hash({response: this.modelFor('response'), validSurveys: this.store.findAll('survey')});},
  setupController: function (controller, model) {controller.set('model', model.response); controller.set('validSurveys', model.validSurveys);}
});
App.ResponseIndexController = Ember.ObjectController.extend({
  validSurveys: []
});
// ResponseEdit
App.ResponseEditRoute = Ember.Route.extend({
  model: function () {return Ember.RSVP.hash({response: this.modelFor('response'), validSurveys: this.store.findAll('survey')});},
  setupController: function (controller, model) {controller.set('model', model.response); controller.set('validSurveys', model.validSurveys);}
});
App.ResponseEditController = Ember.ObjectController.extend({
  validSurveys: [],
  actions: {
    delete: function () {
      var ctrl = this;
      var modl = this.get('model');
      modl.destroyRecord().then(
        function success() {ctrl.transitionToRoute('responses.index');},
        function failure() {dbug('Failed to delete response.');}
      );
    },
    update: function () {
      var ctrl = this;
      var modl = this.get('model');
      modl.save().then(
        function success() {ctrl.transitionToRoute('response.index', modl.get('id'));},
        function failure() {dbug('Failed to update response.');}
      );
    }
  }
});
// ResponseFields (Component)
App.ResponseFieldsComponent = Ember.Component.extend({
  store: null,
  response: null,
  validSurveys: [],
  actions: {
    addAnswer: function () {
      var store  = this.get('targetObject.store');
      var response = this.get('response');
      if(typeof store !== 'undefined') {
        var tempAnswer = store.createRecord('answer'); response.get('answers').pushObject(tempAnswer);
        response.save().then(
          function success() {response.get('answers').removeObject(tempAnswer); tempAnswer.deleteRecord();},
          function failure() {dbug('Failed to create answer.');}
        );
      }
    },
    removeAnswer: function (answer) {
      var store  = this.get('targetObject.store');
      var response = this.get('response');
      if(typeof store !== 'undefined') {
        response.get('answers').removeObject(answer); answer.deleteRecord();
        response.save().then(
          function success() {/*transitionToRoute*/},
          function failure() {dbug('Failed to delete answer.');}
        );
      }
    }
  }
});
//---------------------------------------------------------------
// END: EMBER APPLICATION
//===============================================================


//===============================================================
// BEGIN: EMBER DATA
//---------------------------------------------------------------
// SETUP (PARENT SERIALIZER & DEFAULT ADAPTER)
App.ApplicationSerializer = DS.RESTSerializer.extend({
  // SPECIAL
  primaryKey: '_id',
  // INCOMING (DESERIALIZE)
  extract: function (store, type, payload, id, requestType) {
    // Update CSRF Token
    if(typeof payload !== 'undefined' && typeof payload.meta !== 'undefined' && typeof payload.meta._csrf !== 'undefined') {
      $('meta[name="csrf-token"]').attr('content', payload.meta._csrf);
    }
    return this._super(store, type, payload, id, requestType);
  },
  normalize: function (type, hash, prop) {
    if(typeof hash !== 'undefined' && typeof hash.__v !== 'undefined') {delete hash.__v;}
    return this._super(type, hash, prop);
  },
  // OUTGOING (SERIALIZE)
  serialize: function (record, options) {
    var json = this._super(record, options);
    dbug('serialize:', json);
    return json;
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
  namespace: 'api/v1',
  defaultSerializer: '-default',
  headers: {'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')}//.property().volatile()
  //buildURL: function (type, id) {var url = this._super(type, id); return url + ((url.indexOf('?') !== -1) ? '&' : '?') + 'embed=true';}
});

//---------------------------------------------------------------
// SPECIFIC MODELS, SERIALIZERS, & ADAPTERS

// Question
App.Question = DS.Model.extend({
  //id: DS.attr('string'),
  created:     DS.attr('date', {defaultValue: function() {return new Date();}}),
  slug:        DS.attr('string'),
  type:        DS.attr('string', {defaultValue: 'text'}),
  label:       DS.attr('string'),
  placeholder: DS.attr('string'),
  required:    DS.attr('boolean')
});
App.QuestionSerializer = App.ApplicationSerializer.extend({});
// Survey
App.Survey = DS.Model.extend({
  //id: DS.attr('string'),
  questions:         DS.hasMany('question'),
  created:           DS.attr('date', {defaultValue: function() {return new Date();}}),
  slug:              DS.attr('string'),
  title:             DS.attr('string'),
  description:       DS.attr('string'),
  password:          DS.attr('string'),
  googleAnalyticsId: DS.attr('string'),
  inspectletId:      DS.attr('string'),
  jiraKey:           DS.attr('string')
});
App.SurveySerializer = App.ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {attrs: {questions: {embedded: 'always'}}});

// Answer
App.Answer = DS.Model.extend({
  //id: DS.attr('string'),
  slug:  DS.attr('string'),
  value: DS.attr('string')
});
App.AnswerSerializer = App.ApplicationSerializer.extend({});
// Response
App.Response = DS.Model.extend({
  //id: DS.attr('string'),
  survey:               DS.belongsTo('survey', {async: false}),
  answers:              DS.hasMany('answer'),
  created:              DS.attr('date', {defaultValue: function() {return new Date();}}),
  ipAddress:            DS.attr('string'),
  agent:                DS.attr('string'),
  operatingSystem:      DS.attr('string'),
  device:               DS.attr('string'),
  screenResolution:     DS.attr('string'),
  referrer:             DS.attr('string'),
  visitorId:            DS.attr('string'),
  imported:             DS.attr('boolean'),
  inspectletCaptureSid: DS.attr('string'),
  inspectletCaptureUrl: DS.attr('string')
});
App.ResponseSerializer = App.ApplicationSerializer.extend(DS.EmbeddedRecordsMixin, {attrs: {answers: {embedded: 'always'}}});

//---------------------------------------------------------------
// END: EMBER DATA
//===============================================================

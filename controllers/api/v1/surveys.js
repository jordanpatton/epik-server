var Survey = require('../../../models/Survey');


//===============================================================
// BEGIN: Helpers
function failboat(req, res, err, data) {
  var JSON = {
    "meta": {
      "success": false,
      "error": err,
      "_csrf": (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : ""
    }
  };
  return JSON;
}

function plain(req, res, err, data) {
  var data = (Object.prototype.toString.call(data) !== '[object Array]') ? [data] : data;
  var JSON = {
    "meta": {
      "success": true,
      "_csrf": (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : ""
    },
    "surveys": data
  };
  return JSON;
}

function embed(req, res, err, data) {
  var data = (Object.prototype.toString.call(data) !== '[object Array]') ? [data] : data;
  var JSON = {
    "meta": {
      "success": true,
      "_csrf": (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : ""
    },
    "surveys": data
  };
  return JSON;
}

function sideload(req, res, err, data) {
  // 1. Convert data to Array
  var data = (Object.prototype.toString.call(data) !== '[object Array]') ? [data] : data;
  // 2. Build JSON template
  var JSON = {
    "meta": {
      "success": true,
      "_csrf": (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : ""
    },
    "links": {
      "surveys.questions": {
        "href": req.protocol+"://"+req.get('host')+"/api/v1/questions/{surveys.questions}",
        "type": "questions"
      },
      "surveys.responses": {
        "href": req.protocol+"://"+req.get('host')+"/api/v1/responses/{surveys.responses}",
        "type": "responses"
      }
    },
    "linked": {
      "questions": [],
      "responses": []
    },
    "surveys": []
  };
  // 3. Side-load sub-documents
  for(var i = 0; i < data.length; i++) {
    var survey = data[i];
        survey.links = {"questions": [], "responses": []};
    // 3a. (hasMany) Questions
    if(typeof survey.questions !== 'undefined') {
      for(var j = 0; j < survey.questions.length; j++) {
        if(typeof survey.questions[j]._id !== 'undefined') {
          JSON.linked.questions.push(survey.questions[j]);
          survey.links.questions.push(survey.questions[j]._id);
        }
      }
      delete survey.questions;
    }
    // 3b. (hasMany) Responses
    if(typeof survey.responses !== 'undefined') {
      for(var j = 0; j < survey.responses.length; j++) {
        if(typeof survey.responses[j]._id !== 'undefined') {
          JSON.linked.responses.push(survey.responses[j]);
          survey.links.responses.push(survey.responses[j]._id);
        }
      }
      delete survey.responses;
    }
    JSON.surveys.push(survey);
  }
  // 4. Return JSON object
  return JSON;
}
// END: Helpers
//===============================================================


/**
 * GET /api/v1/surveys
 */
exports.index = function (req, res, next) {
  Survey.find().lean().exec(function (err, data) {
    if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
    else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
    else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
    else                        {res.json(   plain(req, res, err, data));}
  });
};


/**
 * POST /api/v1/surveys
 */
exports.create = function (req, res, next) {
  var payload = typeof req.body.survey !== 'undefined' ? req.body.survey : req.body;
  var survey = new Survey(payload);
  survey.save(function (err, data) {
    if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
    else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
    else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
    else                        {res.json(   plain(req, res, err, data));}
  });
};


/**
 * GET /api/v1/surveys/:id
 */
exports.read = function (req, res, next) {
  Survey.findOne({"_id": req.params.id}).lean().exec(function (err, data) {
    if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
    else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
    else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
    else                        {res.json(   plain(req, res, err, data));}
  });
};


/**
 * PUT /api/v1/surveys/:id
 */
exports.update = function (req, res, next) {
  var payload = typeof req.body.survey !== 'undefined' ? req.body.survey : req.body;
  Survey.update({"_id": req.params.id}, {"$set": payload}, {"upsert": false}).exec(function (err, numberAffected, raw) {
    if(err) {res.json(failboat(req, res, err, raw)); return next(err);}
    else    {
      Survey.findOne({"_id": req.params.id}).lean().exec(function (err, data) {
        if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
        else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
        else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
        else                        {res.json(   plain(req, res, err, data));}
      });
    }
  });
};


/**
 * DELETE /api/v1/surveys/:id
 */
exports.delete = function (req, res, next) {
  Survey.findOne({"_id": req.params.id}).lean().exec(function (err, data) {
    if(err) {res.json(failboat(req, res, err, data)); return next(err);}
    else    {
      Survey.findOne({"_id": req.params.id}).remove(function (err, numberAffected, raw) {
        if(err)                     {res.json(failboat(req, res, err, raw)); return next(err);}
        //else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
        //else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
        //else                        {res.json(   plain(req, res, err, data));}
        else                        {res.json({meta: {success: true, _csrf: res.locals._csrf, raw: raw}});}
      });
    }
  });
};

var Response = require('../../../models/Response');


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
    "responses": data
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
    "responses": data
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
      "responses.surveys": {
        "href": req.protocol+"://"+req.get('host')+"/api/v1/surveys/{responses.surveys}",
        "type": "surveys"
      },
      "responses.answers": {
        "href": req.protocol+"://"+req.get('host')+"/api/v1/answers/{responses.answers}",
        "type": "answers"
      }
    },
    "linked": {
      "surveys": [],
      "answers": []
    },
    "responses": []
  };
  // 3. Side-load sub-documents
  for(var i = 0; i < data.length; i++) {
    var response = data[i];
        response.links = {"surveys": [], "answers": []};
    // 3a. (belongsTo) Survey
    if(typeof response.surveys !== 'undefined') {
      for(var j = 0; j < response.surveys.length; j++) {
        if(typeof response.surveys[j]._id !== 'undefined') {
          JSON.linked.surveys.push(response.surveys[j]);
          response.links.surveys.push(response.surveys[j]._id);
        }
      }
      delete response.surveys;
    }
    // 3b. (hasMany) Answers
    if(typeof response.answers !== 'undefined') {
      for(var j = 0; j < response.answers.length; j++) {
        if(typeof response.answers[j]._id !== 'undefined') {
          JSON.linked.answers.push(response.answers[j]);
          response.links.answers.push(response.answers[j]._id);
        }
      }
      delete response.answers;
    }
    JSON.responses.push(response);
  }
  // 4. Return JSON object
  return JSON;
}
// END: Helpers
//===============================================================


/**
 * GET /api/v1/responses
 */
exports.index = function (req, res, next) {
  Response.find().lean().exec(function (err, data) {
    if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
    else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
    else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
    else                        {res.json(   plain(req, res, err, data));}
  });
};


/**
 * POST /api/v1/responses
 */
exports.create = function (req, res, next) {
  var payload = typeof req.body.response !== 'undefined' ? req.body.response : req.body;
  var response = new Response(payload);
  response.save(function (err, data) {
    if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
    else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
    else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
    else                        {res.json(   plain(req, res, err, data));}
  });
};


/**
 * GET /api/v1/responses/:id
 */
exports.read = function (req, res, next) {
  Response.findOne({"_id": req.params.id}).lean().exec(function (err, data) {
    if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
    else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
    else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
    else                        {res.json(   plain(req, res, err, data));}
  });
};


/**
 * PUT /api/v1/responses/:id
 */
exports.update = function (req, res, next) {
  var payload = typeof req.body.response !== 'undefined' ? req.body.response : req.body;
  Response.update({"_id": req.params.id}, {"$set": payload}, {"upsert": false}).exec(function (err, numberAffected, raw) {
    if(err) {res.json(failboat(req, res, err, raw)); return next(err);}
    else    {
      Response.findOne({"_id": req.params.id}).lean().exec(function (err, data) {
        if(err)                     {res.json(failboat(req, res, err, data)); return next(err);}
        else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
        else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
        else                        {res.json(   plain(req, res, err, data));}
      });
    }
  });
};


/**
 * DELETE /api/v1/responses/:id
 */
exports.delete = function (req, res, next) {
  Response.findOne({"_id": req.params.id}).lean().exec(function (err, data) {
    if(err) {res.json(failboat(req, res, err, data)); return next(err);}
    else    {
      Response.findOne({"_id": req.params.id}).remove(function (err, numberAffected, raw) {
        if(err)                     {res.json(failboat(req, res, err, raw)); return next(err);}
        //else if(req.query.sideload) {res.json(sideload(req, res, err, data));}
        //else if(req.query.embed)    {res.json(   embed(req, res, err, data));}
        //else                        {res.json(   plain(req, res, err, data));}
        else                        {res.json({meta: {success: true, _csrf: res.locals._csrf, raw: raw}});}
      });
    }
  });
};

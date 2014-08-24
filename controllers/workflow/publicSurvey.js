var useragent = require('useragent');
var Survey    = require('../../models/Survey');
var Response  = require('../../models/Response');


/**
 * GET /s
 */
exports.index = function (req, res, next) {
  res.render('workflow/publicSurvey/error', { title: 'Error' });
};


/**
 * GET /s/:survey_slug
 */
exports.read = function (req, res, next) {
  var _csrf = (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : "";
  // 1. Fetch the Survey
  Survey.findOne({"slug": req.params.survey_slug}).lean().exec(function (err, data) {
    if(typeof req.query.json !== 'undefined' && req.query.json !== false && req.query.json !== 'false') {
      // 2a. Respond with JSON
      if(err)                {res.json({"meta": {"success": false, "_csrf": _csrf}}); return next(err);}
      else if(data === null) {res.json({"meta": {"success": false, "_csrf": _csrf}});}
      else                   {
        var PAYLOAD = [{
          "_id":         (typeof data._id         !== 'undefined') ? data._id         : "",
          "slug":        (typeof data.slug        !== 'undefined') ? data.slug        : "",
          "title":       (typeof data.title       !== 'undefined') ? data.title       : "",
          "description": (typeof data.description !== 'undefined') ? data.description : "",
          "questions":   (typeof data.questions   !== 'undefined') ? data.questions   : ""
        }];
        res.json({"meta": {"success": true, "_csrf": _csrf}, "surveys": PAYLOAD});
      }
    } else {
      // 2b. Respond with HTML
      if(err)                {res.render('workflow/publicSurvey/error', { title: 'Error' }); return next(err);}
      else if(data === null) {res.render('workflow/publicSurvey/error', { title: 'Error' });}
      else                   {
        var title = (typeof data.title !== 'undefined') ? data.title : 'Survey';
        res.render('workflow/publicSurvey/app', { title: title, survey: data });
      }
    }
  });
};


/**
 * POST /s/:survey_slug
 */
exports.create = function (req, res, next) {
  var _csrf = (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : "";
  // 1. Build the JSON object
  var agent = useragent.parse((typeof req.body.userAgent !== 'undefined') ? req.body.userAgent : req.headers['user-agent']);
  var PAYLOAD = {
    "survey":               req.body.survey           || req.query.survey           || "",
    "answers":              [],
    "created":              req.body.created          || req.query.created          || Date.now(),
    "ipAddress":            req.body.ipAddress        || req.query.ipAddress        || req.ip,
    "agent":                req.body.agent            || req.query.agent            || agent.toString(),
    "operatingSystem":      req.body.operatingSystem  || req.query.operatingSystem  || agent.os.toString(),
    "device":               req.body.device           || req.query.device           || agent.device.toString(),
    "screenResolution":     req.body.screenResolution || req.query.screenResolution || "",
    "referrer":             req.body.referrer         || req.query.referrer         || "",
    "visitorId":            req.body.visitorId        || req.query.visitorId        || "",
    "imported":             false,
    "inspectletCaptureSid": "",
    "inspectletCaptureUrl": ""
  };
  if(typeof req.body.answers !== 'undefined') {
    for(var key in req.body.answers) {
      if(req.body.answers.hasOwnProperty(key)) {
        PAYLOAD.answers.push({ "slug": key, "value": req.body.answers[key] });
      }
    }
  }
  // 2. Store the JSON object
  var newResponse = new Response(PAYLOAD);
  newResponse.save(function (err, data) {
    // 3. Respond to the user
    if((typeof req.query.json !== 'undefined' && req.query.json !== false && req.query.json !== 'false') || (typeof req.body.isAjax !== 'undefined' && req.body.isAjax === 'yes')) {
      if(err) {res.json({"meta": {"success": false, "_csrf": _csrf}}); return next(err);}
      else    {res.json({"meta": {"success": true, "_csrf": _csrf}});}
    } else {
      if(err) {res.render('workflow/publicSurvey/error', { title: 'Error' }); return next(err);}
      else    {res.render('workflow/publicSurvey/thankyou', { title: 'Thank You' });}
    }
  });
};

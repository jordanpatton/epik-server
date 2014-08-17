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
  Survey.findOne({"slug": req.params.survey_slug}).lean().exec(function (err, data) {
    if(err)                {res.render('workflow/publicSurvey/error', { title: 'Error' }); return next(err);}
    else if(data === null) {res.render('workflow/publicSurvey/error', { title: 'Error' });}
    else                   {
      var title = (typeof data.title !== 'undefined') ? data.title : 'Survey';
      res.render('workflow/publicSurvey/app', { title: title, survey: data });
    }
  });
};


/**
 * POST /s/:survey_slug
 */
exports.create = function (req, res, next) {
  // 1. Build the JSON object
  var agent = useragent.parse((typeof req.body.userAgent !== 'undefined') ? req.body.userAgent : req.headers['user-agent']);
  var JSON = {
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
        JSON.answers.push({ "slug": key, "value": req.body.answers[key] });
      }
    }
  }
  // 2. Store the JSON object
  var newResponse = new Response(JSON);
  newResponse.save(function (err, data) {
    // 3. Respond to the user
    if(typeof req.body.isAjax !== 'undefined' && req.body.isAjax === 'yes') {
      if(err) {res.json({"meta": {"success": false}}); return next(err);}
      else    {res.json({"meta": {"success": true}});}
    } else {
      if(err) {res.render('workflow/publicSurvey/error', { title: 'Error' }); return next(err);}
      else    {res.render('workflow/publicSurvey/thankyou', { title: 'Thank You' });}
    }
  });
};

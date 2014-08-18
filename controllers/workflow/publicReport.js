var Response = require('../../models/Response');
var Survey   = require('../../models/Survey');


/**
 * GET /r
 */
exports.index = function (req, res, next) {
  res.render('workflow/publicReport/error', { title: 'Error' });
};


/**
 * GET /r/:survey_slug
 */
exports.getApp = function (req, res, next) {
  Survey.findOne({"slug": req.params.survey_slug}).lean().exec(function (err, data) {
    if(err)                {res.render('workflow/publicReport/error', { title: 'Error' }); return next(err);}
    else if(data === null) {res.render('workflow/publicReport/error', { title: 'Error' });}
    else                   {
      var survey_id    = (typeof data._id !== 'undefined' && typeof data._id.toString !== 'undefined') ? data._id.toString() : '';
      var survey_title = (typeof data.title !== 'undefined') ? data.title : 'Report';
      //...............................................................
      // Check Session Permissions
      if(typeof req.session.permissions !== 'undefined' && typeof req.session.permissions.surveys !== 'undefined' && req.session.permissions.surveys.indexOf(survey_id) !== -1) {
        res.render('workflow/publicReport/app', { title: survey_title });
      } else {res.redirect('/r/'+req.params.survey_slug+'/login');}
      //...............................................................
    }
  });
};


/**
 * GET /r/:survey_slug/api/v1/responses
 */
exports.getApiV1Responses = function (req, res, next) {
  var _csrf = (typeof res.locals !== 'undefined' && typeof res.locals._csrf !== 'undefined') ? res.locals._csrf : "";
  // QUERY Survey
  Survey.findOne({"slug": req.params.survey_slug}).lean().exec(function (err, data) {
    if(err)                {res.json({"meta": {"success": false, "message": "Unknown error.", "_csrf": _csrf}}); return next(err);}
    else if(data === null) {res.json({"meta": {"success": false, "message": "Survey not found.", "_csrf": _csrf}});}
    else                   {
      var survey_id = (typeof data._id !== 'undefined' && typeof data._id.toString !== 'undefined') ? data._id.toString() : '';
      //...............................................................
      // Check Session Permissions
      if(typeof req.session.permissions !== 'undefined' && typeof req.session.permissions.surveys !== 'undefined' && req.session.permissions.surveys.indexOf(survey_id) !== -1) {
        var sort  = req.query.sort  || {'created': -1};
        var limit = req.query.limit || 100;
        var skip  = req.query.skip  || 0;
        // QUERY Responses
        Response.find({"survey": survey_id}).sort(sort).limit(limit).skip(skip).exec(function (err, data) {
          if(err) {res.json({"meta": {"success": false, "message": "Unknown error.", "_csrf": _csrf}}); return next(err);}
          else    {
            var data = (Object.prototype.toString.call(data) !== '[object Array]') ? [data] : data;
            // Sanitize the data (only send "public" info)
            var JSON = [];
            for(var i = 0; i < data.length; i++) {
              JSON.push({
                "_id":              (typeof data[i]._id              !== 'undefined') ? data[i]._id              : "",
                "survey":           (typeof data[i].survey           !== 'undefined') ? data[i].survey           : "",
                "answers":          (typeof data[i].answers          !== 'undefined') ? data[i].answers          : "",
                "created":          (typeof data[i].created          !== 'undefined') ? data[i].created          : "",
                "ipAddress":        (typeof data[i].ipAddress        !== 'undefined') ? data[i].ipAddress        : "",
                "agent":            (typeof data[i].agent            !== 'undefined') ? data[i].agent            : "",
                "operatingSystem":  (typeof data[i].operatingSystem  !== 'undefined') ? data[i].operatingSystem  : "",
                "device":           (typeof data[i].device           !== 'undefined') ? data[i].device           : "",
                "screenResolution": (typeof data[i].screenResolution !== 'undefined') ? data[i].screenResolution : "",
                "referrer":         (typeof data[i].referrer         !== 'undefined') ? data[i].referrer         : ""
              });
            }
            // QUERY Response.count()
            Response.count({"survey": survey_id}).exec(function (err, count) {
              if(err) {res.json({"meta": {"success": false, "message": "Unknown error.", "_csrf": _csrf}}); return next(err);}
              else    {res.json({"meta": {"success": true, "count": count, "_csrf": _csrf}, "responses": JSON});}
            });
          }
        });
      } else {res.json({"meta": {"success": false, "message": "Access denied: insufficient permissions.", "_csrf": _csrf}});}
      //...............................................................
    }
  });
};


/**
 * GET /r/:survey_slug/login
 */
exports.getLogin = function (req, res, next) {
  Survey.findOne({"slug": req.params.survey_slug}).lean().exec(function (err, data) {
    if(err)                {res.render('workflow/publicReport/error', { title: 'Error' }); return next(err);}
    else if(data === null) {res.render('workflow/publicReport/error', { title: 'Error' });}
    else                   {res.render('workflow/publicReport/login', { title: 'Log In' });}
  });
};


/**
 * POST /r/:survey_slug/login
 */
exports.postLogin = function (req, res, next) {
  Survey.findOne({"slug": req.params.survey_slug}).lean().exec(function (err, data) {
    if(err)                {res.render('workflow/publicReport/error', { title: 'Error' }); return next(err);}
    else if(data === null) {res.render('workflow/publicReport/error', { title: 'Error' });}
    else                   {
      var survey_id       = (typeof data._id !== 'undefined' && typeof data._id.toString !== 'undefined') ? data._id.toString() : '';
      var survey_password = (typeof data.password !== 'undefined') ? data.password : '';
      var input_password  = (typeof req.body.password !== 'undefined') ? req.body.password : '';
      if(survey_password !== '' && input_password === survey_password) {
        //...............................................................
        // Update Session Permissions
        req.session.permissions = req.session.permissions || {};
        req.session.permissions.surveys = req.session.permissions.surveys || [];
        if(req.session.permissions.surveys.indexOf(survey_id) === -1) {req.session.permissions.surveys.push(survey_id);}
        //...............................................................
        res.redirect('/r/'+req.params.survey_slug);
      } else {
        res.redirect('/r/'+req.params.survey_slug+'/login');
      }
    }
  });
};

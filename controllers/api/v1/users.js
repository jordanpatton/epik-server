var User = require('../../../models/User');

/**
 * GET /api/v1/users
 */
exports.index = function (req, res, next) {
  User.find(function (err, data) {
    if(err) {res.json({meta: {success: false, error: err}}); return next(err);}
    else    {res.json({meta: {success: true}, users: data});}
  });
};

/**
 * POST /api/v1/users
 */
exports.create = function (req, res, next) {
  var payload = typeof req.body.user !== 'undefined' ? req.body.user : req.body;
  var user = new User(payload);
  user.save(function (err, data) {
    if(err) {res.json({meta: {success: false, error: err, _csrf: res.locals._csrf}}); return next(err);}
    else    {res.json({meta: {success: true, _csrf: res.locals._csrf}, user: data});}
  });
};

/**
 * GET /api/v1/users/:id
 */
exports.read = function (req, res, next) {
  User.findOne({"_id": req.params.id}, function (err, data) {
    if(err) {res.json({meta: {success: false, error: err}}); return next(err);}
    else    {res.json({meta: {success: true}, user: data});}
  });
};

/**
 * PUT /api/v1/users/:id
 */
exports.update = function (req, res, next) {
  var payload = typeof req.body.user !== 'undefined' ? req.body.user : req.body;
  User.update({"_id": req.params.id}, {"$set": payload}, {"upsert": false}, function (err, data) {
    if(err) {res.json({meta: {success: false, error: err, _csrf: res.locals._csrf}}); return next(err);}
    else    {res.json({meta: {success: true, _csrf: res.locals._csrf, data: data}});}
  });
};

/**
 * DELETE /api/v1/users/:id
 */
exports.delete = function (req, res, next) {
  User.findOne({"_id": req.params.id}).remove(function (err, data) {
    if(err) {res.json({meta: {success: false, error: err, _csrf: res.locals._csrf}}); return next(err);}
    else    {res.json({meta: {success: true, _csrf: res.locals._csrf, data: data}});}
  });
};

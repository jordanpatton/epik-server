/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var methodOverride = require('method-override');
var multer  = require('multer');

var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var contactController = require('./controllers/contact');
var apiV1ResponsesController = require('./controllers/api/v1/responses');
var apiV1SurveysController   = require('./controllers/api/v1/surveys');
var apiV1UsersController     = require('./controllers/api/v1/users');
var workflowCrudController   = require('./controllers/workflow/crud');
var workflowPublicReportController = require('./controllers/workflow/publicReport');
var workflowPublicSurveyController = require('./controllers/workflow/publicSurvey');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */
var app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca({
  csrf: true,
  xframe: 'SAMEORIGIN',
  xssProtection: true
}));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

/**
 * API v1 Routes.
 */
app.get(   '/api/v1/responses',     passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1ResponsesController.index);
app.post(  '/api/v1/responses',     passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1ResponsesController.create);
app.get(   '/api/v1/responses/:id', passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1ResponsesController.read);
app.put(   '/api/v1/responses/:id', passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1ResponsesController.update);
app.delete('/api/v1/responses/:id', passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1ResponsesController.delete);
app.get(   '/api/v1/surveys',       passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1SurveysController.index);
app.post(  '/api/v1/surveys',       passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1SurveysController.create);
app.get(   '/api/v1/surveys/:id' ,  passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1SurveysController.read);
app.put(   '/api/v1/surveys/:id',   passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1SurveysController.update);
app.delete('/api/v1/surveys/:id',   passportConf.isAuthenticated, passportConf.hasRole(['Administrator','Editor']), apiV1SurveysController.delete);
app.get(   '/api/v1/users',         passportConf.isAuthenticated, passportConf.hasRole(['Administrator']),          apiV1UsersController.index);
app.post(  '/api/v1/users',         passportConf.isAuthenticated, passportConf.hasRole(['Administrator']),          apiV1UsersController.create);
app.get(   '/api/v1/users/:id',     passportConf.isAuthenticated, passportConf.hasRole(['Administrator']),          apiV1UsersController.read);
app.put(   '/api/v1/users/:id',     passportConf.isAuthenticated, passportConf.hasRole(['Administrator']),          apiV1UsersController.update);
app.delete('/api/v1/users/:id',     passportConf.isAuthenticated, passportConf.hasRole(['Administrator']),          apiV1UsersController.delete);
/**
 * Workflow Routes.
 */
app.get(   '/r',                                                                                                    workflowPublicReportController.index);
app.get(   '/r/:survey_slug',                                                                                       workflowPublicReportController.read);
app.get(   '/r/:survey_slug/api/v1/responses',                                                                      workflowPublicReportController.getApiV1Responses);
app.get(   '/r/:survey_slug/login',                                                                                 workflowPublicReportController.getLogin);
app.post(  '/r/:survey_slug/login',                                                                                 workflowPublicReportController.postLogin);
app.get(   '/s',                                                                                                    workflowPublicSurveyController.index);
app.get(   '/s/:survey_slug',                                                                                       workflowPublicSurveyController.read);
app.post(  '/s/:survey_slug',                                                                                       workflowPublicSurveyController.create);
app.get(   '/workflow/crud',        passportConf.isAuthenticated, passportConf.hasRole(['Administrator']),          workflowCrudController.index);

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

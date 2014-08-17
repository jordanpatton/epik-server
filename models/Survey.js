var mongoose = require('mongoose');


//...............................................................
// Question (child)
var questionSchema = new mongoose.Schema({
  //_id: { type: mongoose.Schema.Types.ObjectId },
  created:     { type: Date, default: Date.now() },
  slug:        { type: String, default: '', trim: true },
  type:        { type: String, default: 'text', trim: true },
  label:       { type: String, default: '', trim: true },
  placeholder: { type: String, default: '', trim: false },
  required:    { type: Boolean, default: false }
}, { _id: true });

// Constrain the list of valid types.
questionSchema.methods.getValidTypes = function () {
  return ['color','date','datetime','datetime-local','email','hidden','month','number','range','search','tel','text','textarea','time','url','week','other'];
};
questionSchema.path('type').validate(function (value) {
  var validTypes = questionSchema.methods.getValidTypes();
  return (validTypes.indexOf(value) !== -1);
}, 'Question type is invalid.');
//...............................................................


//...............................................................
// Survey (parent)
var surveySchema = new mongoose.Schema({
  //_id: { type: mongoose.Schema.Types.ObjectId },
  questions:        [questionSchema],
  created:           { type: Date, default: Date.now() },
  slug:              { type: String, unique: true, required: 'survey.slug is required.' },
  title:             { type: String, default: '', trim: false },
  description:       { type: String, default: '', trim: false },
  password:          { type: String, default: '', trim: true },
  googleAnalyticsId: { type: String, default: '', trim: true },
  inspectletId:      { type: String, default: '', trim: true },
  jiraKey:           { type: String, default: '', trim: true }
}, { _id: true });

/*
// Duplicate the _id field.
surveySchema.virtual('id').get(function () {return this._id.toHexString();});
// Ensure virtual fields are serialised.
surveySchema.set('toJSON',   {virtuals: true});
surveySchema.set('toObject', {virtuals: true});
*/
//...............................................................


module.exports = mongoose.model('Survey', surveySchema);

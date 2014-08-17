var mongoose = require('mongoose');


//...............................................................
// Answer (child)
var answerSchema = new mongoose.Schema({
  //_id: { type: mongoose.Schema.Types.ObjectId },
  slug:  { type: String, default: '', trim: true },
  value: { type: String, default: '', trim: false }
}, { _id: true });
//...............................................................


//...............................................................
// Response (parent)
var responseSchema = new mongoose.Schema({
  //_id: { type: mongoose.Schema.Types.ObjectId },
  survey:                 { type: mongoose.Schema.Types.ObjectId, ref: 'Survey' },
  answers:               [answerSchema],
  created:                { type: Date, default: Date.now() },
  ipAddress:              { type: String, default: '', trim: true },
  agent:                  { type: String, default: '', trim: true },
  operatingSystem:        { type: String, default: '', trim: true },
  device:                 { type: String, default: '', trim: true },
  screenResolution:       { type: String, default: '', trim: true },
  referrer:               { type: String, default: '', trim: true },
  visitorId:              { type: String, default: '', trim: true },
  imported:               { type: Boolean, default: false },
  inspectletCaptureSid:   { type: String, default: '', trim: true },
  inspectletCaptureUrl:   { type: String, default: '', trim: true }
}, { _id: true });

/*
// Duplicate the _id field.
responseSchema.virtual('id').get(function () {return this._id.toHexString();});
// Ensure virtual fields are serialised.
responseSchema.set('toJSON',   {virtuals: true});
responseSchema.set('toObject', {virtuals: true});
*/
//...............................................................


module.exports = mongoose.model('Response', responseSchema);

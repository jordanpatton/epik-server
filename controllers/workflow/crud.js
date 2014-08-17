/**
 * GET /workflow/crud
 */
exports.index = function (req, res, next) {
  res.render('workflow/crud/app', { title: 'CRUD' });
};

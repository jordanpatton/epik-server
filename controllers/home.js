/**
 * GET /
 * Home page.
 */
 
exports.index = function(req, res) {
  if(req.user) {
    res.render('dashboard', {
      title: 'Dashboard'
    });
  } else {
    res.render('home', {
      title: 'Home'
    });
  }
};

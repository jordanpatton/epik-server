
function getCSRFToken() {
  return $('meta[name="csrf-token"]').attr('content');
}
function setCSRFToken(newCSRFToken) {
  $('meta[name="csrf-token"]').attr('content',newCSRFToken);
  $('input[name="_csrf"]').attr('value',newCSRFToken);
  return newCSRFToken;
}

function getNotification(message, type) {
  var message = message || 'Unknown error occurred.';
  var type = (typeof type !== 'undefined' && ['warning','danger','success','info'].indexOf(type) !== -1) ? type : 'warning';
  return '<div class="alert alert-dismissable alert-'+type+'"><button type="button" class="close" data-dismiss="alert">×</button><div>'+message+'</div></div>';
}

$(document).ready(function () {
  
});

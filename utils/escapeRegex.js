// utils/escapeRegex.js
module.exports = function escapeRegex(text = '') {
  // Escape special regex chars so user input can't break the regex
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

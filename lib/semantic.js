(function (root) {

  /** Main semantic function */
  var semantic = function () {};

  // Export the semantic object. 
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = semantic;
   } else if (typeof define === 'function' && define.amd) {
    define(function() { return semantic; });
  } else {
    root.semantic = semantic;
  }

  // ---------------------
  // returns bold text. just a sample
  // ---------------------
  var entify = semantic.strong = function(src) {

  	if (src.jquery && src.html) {
  	  text = src.html();
  	}
  	
  	return '<strong>'+text+'</strong>';

  };

 // ---------------------
 // APPLY 
 // ---------------------
  semantic.semantify = function(src) {
    var text = src;
    if (src.jquery && src.html) {
      text = src.html();
    }

    text = strong(text);
    
    // text = someOtherFunction(text);

    return text;

  };

}(this));
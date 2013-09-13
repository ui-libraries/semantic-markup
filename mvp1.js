/********* Initialize database **********/

//Doctext allows you to specify formatting options for document texts

Doctext = function(doc) {
	_.extend(this, doc);			
}

Doctext.prototype = {
  constructor: Doctext,		

  formatText: function(format) {
	  switch(format){
	  				
	    case "cookbook":
	    	var myTags = ["recipe"];
			  var myText = addSpanTags(this.text, myTags);
		    return myText;
		    
		  default:
			  return this.text;
	  }
	}
}

Docs = new Meteor.Collection("docs", {
  transform: function(doc){
  	return new Doctext(doc);			
  }
});

Entities = new Meteor.Collection("entities");

Meteor.startup(function() {

})

/********** Server **********/

if (Meteor.isServer) {
				
  	Meteor.startup(function () {
	  Docs.remove({});
    Docs.insert({
	    title: "Ye Olde Cookbook",
	    creator: "Chef Boyardee",
	    text: "<recipe>Spaghetti-o's. Open the can. Heat it up.</recipe> Toast. Put bread in the toaster. Put jam on top. Cereal. Put cereal in bowl. Add milk."
    });
    Entities.remove({});
    /* Entities.insert({
		  text: "Spaghetti-o's. Open the can. Heat it up."
		}); */
  });	
}

/********** Client **********/

if (Meteor.isClient) {
						
  Template.doc.docs = function() {
		return Docs.findOne();	
  };

  Template.doc.events({
    'click button[type="submit"]' : function() {
      var newDoctext = addSemanticTag("recipe");
      Docs.update(this._id, {
        title: this.title,
      	creator: this.creator,
      	text: newDoctext
      });
    }
  });
  
  //for testing purposes: this button removes tags from the document text in the database
  Template.doc.events({
    'click button[class="test"]' : function() {
      oldDoctext = "Spaghetti-o's. Open the can. Heat it up. Toast. Put bread in the toaster. Put jam on top. Cereal. Put cereal in bowl. Add milk."
      Docs.update(this._id, {
      	title: this.title,
      	creator: this.creator,
        text: oldDoctext
      });
    }
  });
  
  Template.entitylist.entities = function() {
  	return Entities.find(); 			
	};
	
	//for testing purposes: this button removes the recipe from the database
	Template.entitylist.events({
	  'click button[class="test"]' : function() {
		  Entities.remove(this._id);			
		}
	});
  
}

/********** Handle user selected text ***********/

function addSemanticTag(tagName) {
//this function takes a string that is the name for a semantic tag
//it assumes that the user has selected a portion of the document text
//it returns a string that is the document text with semantic tags surrounding
//the user-selected text
				
  var selection = getUserSelection();

  if(selection && isDoctext(selection)) {	
  //user has hilighted text in the doctext region
  
	  //create new tag	  
    var newTag = document.createElement(tagName);	  
	  newTag.appendChild(selection.extractContents());
	  selection.insertNode(newTag);
	  
	  //get new entity text, remove span tags, and update Entities
	  var newEntitytext = newTag.innerHTML;
	  newEntitytext = removeSpanTags(newEntitytext);
	  Entities.insert({
		  text: newEntitytext
		});

	  //get new doc text, remove span tags, and update Docs
	  var newDoctext = $("#doctext").html();
	  newDoctext = removeSpanTags(newDoctext);
	  newDoctext = removeEmptyTags(newDoctext, tagName);
	  return newDoctext;
  } 
}
			
function getUserSelection() {
//this function reads the user hilighted text and returns a Range object	
//if and only if the user has hilighted at least one character

  if(window.getSelection) {
	  //for Mozilla, Safari, and Opera, assign a Selction object to userSelection
	  var userSelection = window.getSelection();
	  var textString = userSelection.toString();

	  if (textString.length > 0) {
		  //convert userSelection to Range object and return it
		  userSelection = getRangeObject(userSelection);
		  return userSelection;
	  } else {
		  //user has not hilighted any text
		  return null;
	  }
	
	
  } else if (document.selection) {
	  //older versions of IE, assign a Text Range object to userSelection
	  var userSelection = document.selection.createRange();
	  var textString = userSelection.text;

	  if(textString.length > 0) {
		  return userSelection;
	  } else {
		  //user has not hilighted any text
		  return null;
	  }
  }
  return null;
}

function getRangeObject(selectionObject) {
//this function takes a Selection Object and returns a Range object
  var range;

  if (selectionObject.getRangeAt) {
	  range = selectionObject.getRangeAt(0);
  } else {  
  	//Safari 1.3
	  range = document.createRange();
	  range.setStart(selectionObject.anchorNode,selectionObject.anchorOffset);
	  range.setEnd(selectionObject.focusNode,selectionObject.focusOffset);
  }

  return range;
}

function isDoctext(rangeObject) {
//this function takes a range object and returns true 
//if and only if the range object is contained within the display text

  var parent = rangeObject.commonAncestorContainer;
  var ancestors = $(parent).parents("#doctext");

  if (parent.id == "doctext" || ancestors.length > 0) {
	  return true;
  }
  return false;
}

/********** Add and remove tags **********/

function addSpanTags(string, tags){
//this function takes a string and a array of xml tags
//it assumes that the string represents well-formed xml
//it returns the string with span tags nested inside the xml tags
//the span tags have a class attribute that match their parent xml tags

  for (x in tags) {
    var regexp1 = new RegExp("(<" + tags[x] + "[^>]*>)", "gi");  //opening tag
    var regexp2 = new RegExp("(<\/" + tags[x] + ">)", "gi");  //closing tag
     
    string = string.replace(
      regexp1,
      function($0, $1) {
        //return opening tag + opening span tag
        return ($1 + "<span class=\"" + tags[x] + "\">");
      }
    );
       
    string = string.replace(
      regexp2,
      function($0, $1) {
        //return closing span tag + closing tag
        return ("</span>" + $1);
      }
    );
  }
  return string;
}


function removeSpanTags(string) {
//this function takes a string and returns it with span tags removed

	var regexp1 = /<span[^>]*>/gi;  //opening span tag
	var regexp2 = /<\/span>/gi;  //closing span tag
  
	string = string.replace(regexp1, "");
	string = string.replace(regexp2, "");
	
	return string;
}

function removeEmptyTags(string, tagName) {
//this function takes a string and a tagname for a semantic tag
//it retruns the string with any instances of empty tags of the given tagname 
//removed

	var regexp1 = new RegExp("<" + tagName + "><\/" + tagName + ">", "gi");
	string = string.replace(regexp1, "");
	return string;
}



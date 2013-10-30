/********* Initialize database **********/

//Doctext allows you to specify formatting options for document texts

Doctext = function(doc) {
  _.extend(this, doc);			
}

Doctext.prototype = {
  constructor: Doctext,		
}

//Entitytext allows you to specify formatting options for entity texts

Entitytext = function(entity) {
  _.extend(this, entity);			
}

Entitytext.prototype = {
  constructor: Entitytext,	
  
    formatText: function(format) {		
      switch(format) {		
											
        case "teaser":
          var myText = this.text;
          myText = removeAllTags(myText);
          var longTextArray = myText.split(" ");
          if (longTextArray.length > 5){
            var shortTextArray = longTextArray.slice(0, 5);
            myText = shortTextArray.join(" ") + "...";    
          }
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

Entities = new Meteor.Collection("entities", {
  transform: function(entity){
    return new Entitytext(entity);
  }
});

Meteor.startup(function() {

});

/********** Server **********/

if (Meteor.isServer) {
			
  Meteor.startup(function () {
    Docs.remove({});	
      Docs.insert({
	    title: "Ye Olde Cookbook",
	    creator: "Chef Boyardee",
	    text: "Spaghetti-o's. Open the can. Heat it up. Toast. Put bread in the toaster. Put jam on top. Cereal. Put cereal in bowl. Add milk."
    });
    Entities.remove({});
  });	
}


/********** Client **********/

if (Meteor.isClient) {

  var recipeTag = new Tag("div", "recipe");
  recipeTag.addAttribute("typeof", "schema:Recipe", "none");
  recipeTag.addAttribute("about", "uidata:cookbooks_[timestamp]", "timestamp");
						
  Template.doc.docs = function() {
    return Docs.findOne();
  }

  Template.doc.events({
     'click button[type="submit"]' : function() {
      var newDoctext = addSemanticTag();
      if(newDoctext) {
        Docs.update(this._id, {$set: {'text': newDoctext}});
      } else {
        alert("Invalid selection");
      }
    }
  });
  
  //for testing purposes: this button removes tags from the document text in the database
  /*Template.doc.events({
    'click button[class="test"]' : function() {
      oldDoctext = "Spaghetti-o's. Open the can. Heat it up. Toast. Put bread in the toaster. Put jam on top. Cereal. Put cereal in bowl. Add milk.";
      Docs.update(this._id, {$set: {'text': oldDoctext}});
    }
  });*/
  
  Template.entitylist.entities = function() {
    return Entities.find(); 			
  }
	
  //this button removes the recipe from the database
  Template.entitylist.events({
  'click button[class="button-remove"]' : function() {
    Entities.remove(this._id);
    var docId = document.getElementById("docId").innerHTML.trim();
    var newDoctext = removeSemanticTag(this._id, "doctext");
      Docs.update(docId, {$set: {'text': newDoctext}});
    }
  });
}

/********** Handle user selected text ***********/

function addSemanticTag() {
//this function returns a string that is the document text with semantic tags
//surrounding the user-selected text
				
  var selection = getUserSelection();

  //create new tag
  var newTag = document.createElement("div");
  newTag.appendChild(selection.cloneContents());
  var tagContents = newTag.innerHTML;
  
  if(selection && isDoctext(selection) && !hasOuterTag(selection) && !hasInnerTag(tagContents)) {	
  //user has hilighted text in the doctext region that has not already been hilighted

    //insert new tag into DOM
    selection.extractContents(); 
    selection.insertNode(newTag);
	  
    //add to Entities database
    var newEntityId = Entities.insert({
      text: tagContents
    });
	  
    //set attributes
    newTag.setAttribute("id", newEntityId);
    var attributes = recipeTag.getAttributes();
    for (var i=0; i < attributes.length; i++) {
      var name = attributes[i].getName();
      var value = attributes[i].getValue();
      newTag.setAttribute(name, value);
    }

    //update Docs
    var newDoctext = $("#doctext").html();
    newDoctext = removeEmptyTags(newDoctext, recipeTag.getName());
    return newDoctext;
  } 
  return null;
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


function hasOuterTag(rangeObject) {

  var className = recipeTag.getClass();
  var tagName = recipeTag.getName();
  var parent = rangeObject.commonAncestorContainer;
  var ancestors = $(parent).parents(tagName);
  
  if ($(parent).hasClass(className)) {
    return true;
  } else {
  }
  
  for (var i=0; i < ancestors.length; i++) {
    if ($(ancestors[i]).hasClass(className)) { 
      return true;
    } else {
    }
  }
  return false;
}

function Tag(name, className) { 
  
  var name = name;
  var className = className;
  var attributes = [
    new Attribute("class", className, "none")
  ];

  this.getName = function() {
    return name;
  }

  this.getAttributes = function() {
    return attributes;
  }

  this.getClass = function() {
    return className;
  }

  this.addAttribute = function(name, rawValue, action) {
    attributes.push(new Attribute(name, rawValue, action));
  }
}

function Attribute(name, rawValue, action) {
  
  var name = name;
  var rawValue = rawValue;
  var action = action;
  
  this.getName = function() {
    return name;
  }

  this.getValue = function() {
    var myValue = rawValue;
    if(action != "none") {
      switch (action) {
        case "timestamp":
          return timestamp(myValue);
        default:
          return myValue;
      }
    } 
    return myValue;
  }

  function timestamp(myValue) {
  //this function takes a string myValue
  //it replaces the substring "[uid]" with a unique id string  
    
    var timestamp = Date.now().toString();
    return myValue.replace("[timestamp]", timestamp);
  }
}

function hasInnerTag(string) {
//this function takes a string and the name of a tag
//it returns true if the string contains neither and opening nor closing tag
//of the given name

  var tagName = recipeTag.getName();
  var className = recipeTag.getClass();
				
  var regexp1 = new RegExp("<" + tagName + "[^>]*class=\"[^\"]*" + className); 
  
  if (string.search(regexp1) != -1) {
    return true;							
  }
  return false;			
}

/********** Add and remove tags **********/

/*function addSpanTags(string, tags){
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
}*/


/*function addClass(string, identifier, classValue) {
  var regexp1 = new RegExp("(<[^>]*" + identifier + ")", "gi");

  string = string.replace( 
    regexp1,
    function($1) {
      return ($1 + " class=\"" + classValue + "\"");
    }
  );
  return string;
}*/

/*function removeClass(string, classValue) {

  var regexp1 = new RegExp("class=\"" + classValue + "\"", "gi");
  string = string.replace(regexp1, "");

  return string;
}*/


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

function removeSemanticTag(tagId, containerId) {
//this function takes an id for a semantic tag and the id of its container
//it returns the string with the tag of the given id removed and all span tags
//removed

  //replace the semantic tag of the given tagId with a span tag
  var node = document.getElementById(tagId);
  var parent = node.parentNode;
  var newNode = document.createElement("span");
  newNode.innerHTML = node.innerHTML;
  parent.replaceChild(newNode, node);

  //get html of container element and remove all span tags
  var string = document.getElementById(containerId).innerHTML;
  string = removeSpanTags(string);

  return string;
}

function removeAllTags(string) {
//this function takes a string and removes all tags
  var tmp = document.createElement("span");
  tmp.innerHTML = string;
  return tmp.textContent;
}

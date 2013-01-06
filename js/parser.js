/*
 * Copyright 2013 Jesper Borgstrup
 *
 * This file is part of Android Layout Finder.
 * 
 * Android Layout Finder is free software: you can redistribute it and/or modify it under 
 * the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 * 
 * Android Layout Finder is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * 
 * See http://www.gnu.org/licenses/ for the full license text
 */

var images = ["AbsoluteLayout","AdapterViewFlipper","AnalogClock","AutoCompleteTextView","Button","CalendarView","CheckBox","CheckedTextView","Chronometer","DatePicker","DialerFilter","DigitalClock","EditText","ExpandableListView","FrameLayout","Gallery","GestureOverlayView","GridLayout","GridView","HorizontalScrollView","ImageButton","ImageSwitcher","ImageView","LinearLayout","MediaController","MultiAutoCompleteTextView","NumberPicker","ProgressBar","QuickContactBadge","RadioButton","RadioGroup","RatingBar","RelativeLayout","ScrollView","SearchView","SeekBar","SlidingDrawer","Space","Spinner","StackView","SurfaceView","Switch","TabHost","TableLayout","TableRow","TabWidget","TextSwitcher","TextureView","TextView","TimePicker","ToggleButton","TwoLineListItem","VerticalLinearLayout","ViewAnimator","ViewFlipper","ViewStub","ViewSwitcher","WebView","ZoomButton","ZoomControls"];

function sampleData() {
	$("#xml_input").val( "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<RelativeLayout xmlns:android=\"http://schemas.android.com/apk/res/android\"\n    xmlns:tools=\"http://schemas.android.com/tools\"\n    android:layout_width=\"match_parent\"\n    android:layout_height=\"match_parent\"\n    android:background=\"@color/black\"\n    tools:ignore=\"Overdraw\" >\n\n    <VideoView\n        android:id=\"@+id/videoView\"\n        android:layout_width=\"match_parent\"\n        android:layout_height=\"match_parent\"\n        android:layout_centerInParent=\"true\" />\n\n    <ProgressBar\n        android:id=\"@+id/videoProgressBar\"\n        style=\"@android:style/Widget.ProgressBar.Large\"\n        android:layout_width=\"100dp\"\n        android:layout_height=\"100dp\"\n        android:layout_centerInParent=\"true\" />\n\n<\/RelativeLayout>" );
	generateTreeFromInput();
	generateJavaFromTree();
}

function generateTreeFromInput() {
	var rootElement;
	try {
		xmlDoc = $.parseXML( $("#xml_input").val() );
		root = $( $( xmlDoc ).find( ":first" ).get() );
		if ( root.children().length == 0 ) {
			$('#tree_alert').html('<div class="alert alert-info"><span>Paste in your Empty XML file</span></div>');
			$('#code_alert').html('<div class="alert alert-info"><span>Paste in your Empty XML file</span></div>');
			$('#tree').html('');
			
			$('#output').hide();
			return;
		}
		rootElement = recursiveParseXmlElement( root, 0 );
	}
	catch (err) {
		$('#tree_alert').html('<div class="alert alert-error"><span>'+err.message+'</span></div>');
		$('#code_alert').html('<div class="alert alert-error"><span>'+err.message+'</span></div>');
		$('#tree').html('');
		$('#output').hide();
		return;
	}

	// Clear any error
	$('#tree_alert').html('');
	$('#code_alert').html('');
	$('#tree').removeAttr('disabled');
	$('#output').show();

	var tree = prepareForTree( rootElement );
	
	$("#tree").dynatree({
		persist: true,
		checkbox: true,
		selectMode: 2,
		children: tree,
		imagePath: "img/tree/",
		onSelect: function(node) {
			generateJavaFromTree();
		},
 		onActivate: function(node) {
 			node.select();
		}
	});
	$("#tree").dynatree("getTree").reload();
	$("#tree").dynatree("getRoot").visit(function(node){
		node.expand(true);
	});
	generateJavaFromTree();
}

function generateJavaFromTree() {
	var root = $("#tree").dynatree("getRoot");
	var selected = getSelectedTreeNodes( root );
	
	if ( selected.length == 0 ) {
		$("#output").val('');
	}
	
	var result = "";
	for ( var i = 0; i < selected.length; i++ ) {
		var node = selected[i];
		result += "\tprivate " + node.className + " " + node.id + ";\n";
	}
	
	var parentview = $("#chk_parentview").is(":checked") ? $("#edt_parentview").val() : "";
	var parentview_dot = parentview == "" ? "" : parentview+".";
	result += "\n";
	result += "\tprivate void initializeViews() {\n";
	for ( var i = 0; i < selected.length; i++ ) {
		var node = selected[i];
		if ( node.type == "view" ) {
			result += "\t\t" + node.id + " = ("+node.className+")"+ parentview_dot + "findViewById( R.id."+node.id+");\n";
		} else if ( node.type == "fragment") {
			var fragmentMan = $("#chk_support").is(":checked") ? "getSuppportFragmentManager()" : "getFragmentManager()";
			result += "\t\t" + node.id + " = ("+node.className+")" + fragmentMan + ".findFragmentById( R.id."+node.id+");\n";
		}
	}
	
	result += "\t}\n";
	
	$("#output").text( result );
}

function getSelectedTreeNodes( root ) {
	var result = [];
	if ( root.isSelected() ) {
		result.push( root.data );
	}
	var children = root.getChildren();
	if ( children != null ) for ( var i = 0; i < children.length; i++ ) {
		result = result.concat( getSelectedTreeNodes( children[i] ) );
	}
	return result;
}

$(document).ready(function() {
	//	sampleData();
	generateTreeFromInput();
	$("#button_parse").click(function() {
		generateTreeFromInput();
	});
//	$("#button_copy_java").click(function() {
//		alert("BLAH");
//	})
	$("#button_copy_java").zclip({
	    path: "js/ZeroClipboard.swf",
	    copy: function(){
	    	alert("copied to clipboard");
	    	return $("#output").val();
	    }
	});
	$("#button_generate").click(function() {
		generateJavaFromTree();
	});
	$("#button_example").click(function() {
		sampleData();
	});
	$("#xml_input").bind("keyup paste", function(e){
		generateTreeFromInput();
	});
	$("#xml_input").focus(function() {
	    var $this = $(this);
	    $this.select();

	    // Work around Chrome's little problem
	    $this.mouseup(function() {
	        // Prevent further mouseup intervention
	        $this.unbind("mouseup");
	        return false;
	    });
	});
	$("#output").click(function() {
		SelectText("output");
	});
	$("#chk_support").change(function() {
		generateJavaFromTree();
	});
	$("#chk_parentview").change(function() {
		generateJavaFromTree();
	});
	$("#edt_parentview").bind("keyup paste", function(e){
		var view = $("#edt_parentview").val();
		if ( view == '' ) {
			$("#chk_parentview").removeAttr( "checked" );
		}
		if ( view != '' ) {
			$("#chk_parentview").attr('checked', 'checked');
		}
		generateJavaFromTree();
	});
	$(document).on('dragenter',function(event){
		event.preventDefault();
		$(document).cursor( 'not-allowed' );
		$("*:visible").fadeTo( 500, 50 );
		$('#xml_input').fadeTo( 500, 100 );
	});
	$(document).on('dragleave',function(event){
		event.preventDefault();
		$(document).cursor( 'auto' );
		$("*:visible").fadeTo( 500, 50 );
	});
	$(document).on('dragover',function(event){
		event.preventDefault();
	});
	$('#xml_input').on('dragover', function(event) {
				
	});
	$('#xml_input').on('drop', function(event) {

		 //stop the browser from opening the file
		 event.preventDefault();

		 //Now we need to get the files that were dropped
		 //The normal method would be to use event.dataTransfer.files
		 //but as jquery creates its own event object you ave to access 
		 //the browser even through originalEvent.  which looks like this
		 var files = event.originalEvent.dataTransfer.files;

		 //Use FormData to send the files
		 var formData = new FormData();

		 //append the files to the formData object
		 //if you are using multiple attribute you would loop through 
		 //but for this example i will skip that
		 formData.append('files', files[0]);

		 });
});

function Element(name, id, children) {
	this.name = name;
	this.id = id;
	this.children = children;
}

Element.prototype.toString = function() {
	var result = "<" + this.name + " id='"+this.id+"'>";
	for ( var i = 0; i < this.children.length; i++ ) {
		result += this.children[i];
	}
	result += "</" + this.name + ">";
	return result;
};

function recursiveParseXmlElement( xml_el ) {
	var children = [];
 	for ( var i = 0; i < xml_el.children().length; i++ ) {
 		child = xml_el.children().eq(i);
		children.push( recursiveParseXmlElement( child ) );
	}
 	var tagName = xml_el.prop( "tagName" );
 	var type = "view";
 	var className = tagName;
 	if ( className == "fragment" ) {
 		className = xml_el.attr( "android:name" );
 		type = "fragment";
 	}
 	var id = stripIdPrefix( xml_el.attr("android:id") );
 	return { "className": className,
 			 "type": type,
 			 "id": id,
 			 "children": children };
}

function prepareForTree( el ) {
	var children = el['children'];
	for ( var i = 0; i < children.length; i++ ) {
		children[i] = prepareForTree( children[i] );
	}
	
 	var hasId = typeof el['id'] != "undefined";
 	
 	var icon = images.indexOf( el['className'] ) > -1 ? el['className'] : "customView";
 	if ( el['className'] == "fragment" ) {
 		icon = "fragment";
 	}
	el[ "title" ] = (hasId ? el['id'] + " " : "") + "<i>" + el['className'] + "</i>";
	el[ "icon" ] = "view-icons/" + icon + ".png";
	el[ "unselectable" ] = !hasId;
	el[ "select" ] = hasId;

	
	return el;
}

function stripIdPrefix( idString ) {
	if ( typeof idString == 'undefined' ) {
		return undefined;
	}
	
	if ( idString.charAt( 0 ) == "@" ) {
		return idString.substring( idString.indexOf( "/", 0 ) + 1, idString.length );
	}
	return idString;
}

function SelectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection
    ;    
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();        
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
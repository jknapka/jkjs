//-------------------------------------------
// Set up the JKJS framework.
//-------------------------------------------
JKJS_FRAMEWORK = {

	// A table of refresh functions that update tables
	// by fetching appropriate data from the server.
	refreshFns : {},

	// Register a refresh function with a given name.
	// These functions are referred to by data-jkjs-refresh-fn
	// attributes on <table> tags in the HTML.
	registerRefreshFunction: function (fnName,fn) {
		this.refreshFns[fnName] = fn;
	},

	// Get a refresh function by name.
	getRefreshFunction: function (fnName) {
		return this.refreshFns[fnName];
	},

	toggleHelp: function (evt) {
		let helpDiv = $(".help-div");
		let helpToggle = $(".jkjs-help-toggle");
		console.log("help display is " + helpDiv.css("display"));
		console.log("isHelpActive is "+this.isHelpActive+" "+JKJS_FRAMEWORK.isHelpActive);
		if (helpDiv.css("display") == "none") {
			helpToggle.html("Hide help.");
			helpDiv.css("display","block");
			this.isHelpActive = true;
		} else {
			helpToggle.html("Help with this page...");
			helpDiv.css("display","none");
			this.isHelpActive = false;
		}
		console.log("help display is now " + helpToggle.css("display"));
	},

	isHelpActive : false,

	// Set up the framework. This should be called after the
	// document is loaded.
	setUp : function () {

		// Convert an object to a string, for logging purposes.
		function obj2str(pos) {
			let result = "";
			for (var key in pos) {
				if (pos.hasOwnProperty(key)) {
					let val = pos[key];
					if (typeof val === 'object' && val != null) {
						val = "{"+obj2str(val)+"}";
					}
					result = result + key + "=" + val + ", ";
				}
			}
			return result;
		}
		JKJS_FRAMEWORK["obj2str"] = obj2str;

		// Get the next cell in the table containing the
		// given cell.
		function getNextTD(td) {
			const tbl = $(td.closest("table"));
			const allCells = tbl.find("td");
			const which = allCells.index(td);
			if (which < allCells.length - 1) {
				return $(allCells[which + 1]);
			}
			return null;
		}

		// Given a TD reference, get the surrounding TR element
		// and retrieve the value of the given attribute name
		// from the TR.
		function getTrAttribFromTd(originalCell,attribName) {
			const tr = originalCell.closest("tr");
			const value = $(tr).attr(attribName);
			return value;
		}

		// Given a TD reference, get the surrounding TABLE element
		// and retrieve the value of the given attribute name
		// from the TABLE.
		function getTableAttribFromTd(originalCell,attribName) {
			const tr = originalCell.closest("table");
			const value = $(tr).attr(attribName);
			return value;
		}

		// Given a TD and an attribute name, check the surrounding
		// TR for an attribute of the given name and, if present,
		// return its value. Otherwise look for the attribute in the
		// surrounding TABLE and, if present, return its value.
		// Otherwise return undefined.
		function getTrOrTableAttribFromTD(td,attrib) {
			let val = getTrAttribFromTd(td,attrib);
			if (typeof val === "undefined") {
				val = getTableAttribFromTd(td,attrib);
			}
			return val;
		}

		const TABLE_EDIT_URL_ATTR = "data-jkjs-edit-url";
		const KEY_ID_ATTR = "data-jkjs-key-id";
		const KEY_NAME_ATTR = "data-jkjs-key-name";
		const CONTROL_ID_ATTR = "data-jkjs-control-id";
		const CONTROL_FN_ATTR = "data-jkjs-control-fn";
		const REFRESH_FN_ATTR = "data-jkjs-refresh-fn";
		const DATA_ATTR_ATTR = "data-jkjs-data-attribute";

		const EDITOR_ID = "#jkjs-editor";
		const OVERLAY_ID = "#jkjs-overlay";

		// Given a <td> element, get the data-jkjs-edit-url attribute
		// of the surrounding <tr> or <table>.
		function getServerUrlFromTD(td) {
			return getTrOrTableAttribFromTD(td,TABLE_EDIT_URL_ATTR);
		}

		// Given a <td> element, find the ID of the server data object
		// it is associated with. That ID is encodeded in the data-jkjs-key-id
		// attribute of the surrounding <tr> element.
		function getKeyIdFromTD(originalCell) {
			return getTrAttribFromTd(originalCell,KEY_ID_ATTR);
		}

		// Get the name of the data table primary key from either the
		// surrounding <tr> or the surrounding <table> element of
		// a <td> element.
		function getKeyNameFromTD(originalCell) {
			return getTrOrTableAttribFromTD(originalCell,KEY_NAME_ATTR);
		}

		// Commit an edit to the server via an AJAX request,
		// then re-render the container and call the given
		// targetUpdateFn to update the caller's reference to
		// the cell being edited.
		//
		// @param serverUrl:
		//		the URL to call on the server to commit the change.
		//
		// @param key_name:
		//		a PK name property to add to the submitted data.
		//
		// @param key_id:
		//		the PK value for the key_name property.
		//
		// @param attribute:
		//		the table attribute to be updated.
		//
		// @param value:
		//		the value to be set on the table attribute.
		//
		// @param refreshFn:
		//		a function to call to refresh the edited table after
		//		the update is committed.
		//
		// @param targetUpdateFn:
		//		a function to call to re-qcquire a valid reference to
		//		the table cell being edited, after the refreshFn is
		//		called.
		function commitChangeToServer(serverUrl,key_name,key_id,attribute,value,refreshFn,targetUpdateFn) {
			const inputValue = { };
			// IMO this is an annoying misfeature in Javascript: variables
			// cannot be used as attribute names in object literals.
			inputValue[key_name] = key_id;
			inputValue[attribute] = value;

			console.log("Submitting AJAX request with data: "+JSON.stringify(inputValue));

			// Per the HTTP spec, since we are changing the state of a
			// resource with a known URL, and this operation is idempotent
			// (we can repeat the operation without further changing the
			// resource's state), we should use a PUT request.
			//
			// TO DO: the choice of PUT vs POST should probably be
			// made via a table or row parameter, with PUT being the
			// default since we are typically editing an existing
			// table row in an idempotent fashion.
			$.ajax({
				url: serverUrl,
				data: JSON.stringify(inputValue),
				type: "PUT",
				contentType: "application/json",
				dataType: "json",
				success: function (data) {
					console.log("JSON data is "+JSON.stringify(data));
					refreshFn(data);
					targetUpdateFn();
				},
				error: function (xhr, ajaxOptions, thrownError) {
					console.log("Error in AJAX request: "+thrownError);
				}
			});
		}

		// Given an existing target cell (jQuery wrapper), try to
		// edit the next cell in the table.
		function startEditingNextCell(target) {
			const nextCell = getNextTD(target);
			if (nextCell) {
				startEditing(nextCell); // Edit the next cell.
			}
		}

		// Get a target-update function for a given target. The resulting
		// function is called after the document is refreshed and, if
		// requested, moves the editor to the next cell in the table.
		// We must do this because refreshing the table may completely destroy
		// and re-creates the affected DOM, so we cannot continue to use
		// any reference to the cell that we were using before the refresh.
		function getTargetUpdater(target,editNextCell=false) {
			return (function () {
				const id = target.attr("id");
				target = $(":root").find("td#"+id);
				if (editNextCell) {
					startEditingNextCell(target);
				}
			});
		}

		// This is the "controller" function for text table cells.
		// Within this function, #jkjs-editor refers to the editor
		// control tag (eg the actual <input> or <select> tag), and
		// #jkjs-overlay refers to the <div> surrounding the editor.
		// The #jkjs-overlay div and its contents are removed when
		// editing ends.
		//
		// @param target The original click target cell.
		// @param controlElem The control element - an editor control.
		// @param dataAttribute The name of the rperson attribute to
		// update on the server when an edit is committed.
		function jkspaTextController(target,controlElem,dataAttribute,refreshFn) {

			// Update the underlying table with the editor value.
			function commitChange(editNextCell = false) {
				const key_id = getKeyIdFromTD(target);
				const key_name = getKeyNameFromTD(target);
				const inputEl = $(EDITOR_ID);
				const value = inputEl.val().trim();
				const url = getServerUrlFromTD(target);
				$(OVERLAY_ID).remove();
				commitChangeToServer(url,key_name,key_id,dataAttribute,value,refreshFn,getTargetUpdater(target,editNextCell));
			}

			// Handle keystrokes in the input field. ESC aborts, TAB commits.
			$(EDITOR_ID).keydown(function (evt) {
				if (evt.which == 27) {
					// ESC - stop editing.
					evt.stopPropagation(); // No parent elements should see this.
					$(OVERLAY_ID).remove(); // Remove the editor without committing the change.
				}
				if (evt.which == 9) {
					// TAB - commit and edit next cell.
					evt.preventDefault(); // Make sure the default taborder is NOT honored.
					evt.stopPropagation(); // No parent elements should see this.
					commitChange(true); // Commit the change to the underlying table cell.
				}
				if (evt.which == 13) {
					// RETURN - commit and stop editing.
					evt.preventDefault();
					evt.stopPropagation();
					commitChange();
				}
			});
			$(EDITOR_ID).keyup(function (evt) {
				if (evt.which == 9) {
					// TAB - don't let the default taborder happen.
					evt.preventDefault();
				}
			});

			$(EDITOR_ID).val(target.html().trim());
			$(EDITOR_ID).select();
			$(EDITOR_ID).focus();
		}

		// This is the "control" function for list-selection table cells.
		//
		// @param target The original click target cell.
		// @param controlElem The control element - an editor control.
		// @param dataAttribute The name of the rperson attribute to
		// update on the server when an edit is committed.
		function jkspaSelectController(target,controlElem,dataAttribute,refreshFn) {

			// Update the underlying table with the editor value.
			function commitChange(editNextCell=false) {
				// It annoys me that I don't see a super-clean way to factor commitChange()
				// out of these controller functions. We need access to the enclosing
				// scope, which means a higher-level version would need a bunch of
				// parameters. [Note, that's obviously the right thing to do, but
				// I'm not going to take the trouble right now.] This is a case where
				// something like Common Lisp's dynamic scope or (pretty similarly) Tcl/Tk's
				// "uplevel" would be tempting to use (but also horribly unmaintainable and
				// therefore wrong).
				const key_id = getKeyIdFromTD(target);
				const key_name = getKeyNameFromTD(target);
				const inputEl = $(EDITOR_ID+" option:selected");
				const value = inputEl.val();
				const url = getServerUrlFromTD(target);
				$(OVERLAY_ID).remove();
				commitChangeToServer(url,key_name,key_id,dataAttribute,value,refreshFn,getTargetUpdater(target,editNextCell));
			}

			$(EDITOR_ID).click(function(evt) {
				evt.stopPropagation();
			});

			$(EDITOR_ID).change(function (evt) {
				commitChange();
				$(OVERLAY_ID).remove();
			});

			// Handle keystrokes in the input field. ESC aborts, TAB commits.
			$(EDITOR_ID).keydown(function (evt) {
				if (evt.which == 27) {
					// ESC - stop editing.
					evt.stopPropagation(); // No parent elements should see this.
					$(OVERLAY_ID).remove(); // Remove the editor without committing the change.
				}
				if (evt.which == 9) {
					// TAB - commit and edit next cell.
					evt.preventDefault(); // Make sure the default taborder is NOT honored.
					evt.stopPropagation(); // No parent elements should see this.
					commitChange(true); // Commit the change to the underlying table cell.
				}
				if (evt.which == 13) {
					// RETURN - commit and stop editing.
					evt.preventDefault();
					evt.stopPropagation();
					commitChange();
				}
			});
			$(EDITOR_ID).keyup(function (evt) {
				if (evt.which == 9) {
					// TAB - don't let the default taborder happen.
					evt.preventDefault();
				}
			});

			const curVal = target.html();
			const selVal = getSelectionValueForOptionText($(EDITOR_ID),curVal);
			$(EDITOR_ID).val(selVal);
			$(EDITOR_ID).focus();
		}

		// Given a <select> wrapper and the text of an <option> tag
		// within the <select>, find the option tag and return its
		// value attribute.
		function getSelectionValueForOptionText(elem,curVal) {
			const opts = elem.find("option");
			for (var ii=0; ii<opts.length; ++ii) {
				if ($(opts[ii]).html() === curVal) {
					return $(opts[ii]).attr("value");
				}
			}
			return null;
		}

		// A map of control-handler function names to their
		// respective functions. This allows us to refer to
		// control functions by name in the HTML.
		// TO DO: we need to be able to register new controllers,
		// like we can register new renderers.
		const controlHandlers = {
			"jkspaTextController":jkspaTextController,
			"jkspaSelectController":jkspaSelectController
		};

		// If an overlay editor is open, close it.
		function dismissOverlay() {
			const overlay = $(OVERLAY_ID);
			if (overlay.length > 0) {
				overlay.remove();
			}
		}

		// Handle a click on a JKJS control field.
		function jkJsHandleClick(evt) {
			if (evt == null || evt.target == null) {
				return;
			}
			startEditing($(evt.target));
		}

		// Given an editor element, return the default controller
		// function for that element. This is used only if the editor
		// element does not have a data-jkjs-controller attribute
		// naming the controller function.
		function getDefaultControllerForElement(el) {
			if ($(el).is("select")) {
				return "jkspaSelectController";
			} else {
				return "jkspaTextController";
			}
		}

		// Invoke the editor for the given target cell, if
		// one is defined.
		function startEditing(target) {
			dismissOverlay();

			console.log("target: "+JSON.stringify(target));

			// Figure out where the clicked cell is.
			const off = $(target).offset();
			const pos = $(target).position();

			//const sz = $(target).size();

			// Get the editor HTML and JS controller method.
			const templateName = $(target).attr(CONTROL_ID_ATTR);
			if (typeof templateName == "undefined") {
				return;
			}
			const controlElem = $.parseHTML($("#"+templateName).html().trim());
			const controlWrapper = $(controlElem);
			let funcName = $(controlElem).attr(CONTROL_FN_ATTR);
			if (typeof funcName == "undefined") {
				funcName = getDefaultControllerForElement(controlElem);
			}
			const func = controlHandlers[funcName];
			if (typeof func === "undefined") {
				return;
			}

			// Get the refresh function for the table.
			const refreshFnName = getTrOrTableAttribFromTD($(target),REFRESH_FN_ATTR);
			const refreshFn = JKJS_FRAMEWORK.getRefreshFunction(refreshFnName);

			// Get the data attribute name.
			const  dataAttrib = $(target).attr(DATA_ATTR_ATTR);

			// Position the div and the control.
			const ndiv = $('<div id="jkjs-overlay"></div>');
			$(":root").append(ndiv);

			// Ensure the editor ID is set correctly (maybe? the behavior is confusing...).
			controlWrapper.attr("id","jkjs-editor");

			ndiv.append(controlWrapper);

			// Move the control over the clicked table cell.
			// Some of this could be out-of-line CSS.
			ndiv.css("position", "absolute");
			ndiv.css("zindex", 100);
			ndiv.css("background-color", "#FFFFFF");
			ndiv.css("padding", "5px");
			ndiv.css("top", off.top);
			ndiv.css("left", off.left);
			ndiv.css("max-height", $(target).height()*2.0);
			ndiv.css("max-width", $(target).width()*2.0);

			// Configure the control.
			func($(target),controlElem,dataAttrib,refreshFn);
		}

		// Set the click handler on all JKJS control fields.
		// This actually binds a handler on the document that
		// will get called for any element with the jkjs-control
		// class.
		$(document).on('click','.jkjs-control',jkJsHandleClick);

	}

};

$(JKJS_FRAMEWORK.setUp());
//-------------------------------------------
// END JKJS Framework
//-------------------------------------------

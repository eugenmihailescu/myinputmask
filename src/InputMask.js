/**
 * Adds input mask functionality to your HTML inputs elements.
 * @author Eugen Mihailescu
 * @url: https://github.com/eugenmihailescu/myinputmask
 * 
 * @param config
 *            An object with two properties: an list of input elements and optionally the mask symbol.
 * @returns Returns the object instance
 */
/**
 * @param config
 * @returns
 */
function InputMask(config) {
    "use strict";
    var _this_ = {};
    _this_.name = "InputMaskPlugin";

    _this_.inputs = config.inputs || {};
    _this_.mask_symbol = config.mask_symbol || "_";
    _this_.autoinit = config.autoinit || true;
    _this_.wait = false;
    var CHAR = "character";

    var KEY_BKSP = "Backspace";
    var KEY_DEL = "Delete";
    var KEY_TAB = "Tab";
    var KEY_LEFT = "ArrowLeft";
    var KEY_RIGHT = "ArrowRight";
    var NAV_KEYS = [ "Shift", "Control", "Home", "End", "CapsLock", KEY_LEFT, KEY_RIGHT, KEY_DEL, KEY_BKSP, KEY_TAB ];

    /**
     * Populates the data with the default properties if not already existing
     * 
     * @prop data Object of data properties
     */
    function getDefaultData(data) {
        data.mask = data.mask || "";
        data.pattern = data.pattern || ".";
        data.strict = data.strict || true;

        return data;
    }

    /**
     * Select a given range within the current `_this_` element
     * 
     * @param start
     *            The starting index for selection
     * @param end
     *            The last index of selection
     */
    function selectRange(elem, start, end) {
        if (end === undefined) {
            end = start;
        }
        if (elem.selectionStart) {
            elem.selectionStart = start;
            elem.selectionEnd = end;
        } else if (elem.setSelectionRange) {
            elem.setSelectionRange(start, end);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd(CHAR, end);
            range.moveStart(CHAR, start);
            range.select();
        }
    }

    /**
     * Get the caret position within the given input element
     * 
     * @param element
     *            The selection element
     * @return The caret position within the given input element
     */
    function getCaretPosition(element) {
        if (undefined === typeof element) {
            return false;
        }

        var pos = 0;
        if (element.selectionStart) {
            pos = element.selectionStart;
        } else if (document.selection) {
            element.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart(CHAR, -element.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }

    /**
     * Move the input's caret to the specified position
     * 
     * @param elem
     *            The input element where the cares is moved
     * @param position
     *            The new position of the caret
     */
    function moveCaret(elem, position) {
        selectRange(elem, position, position);
    }

    /*
     * Reformat the input element @param elem The input element to reformat @param caret_pos If specified then moves the caret
     * position to the given value
     */
    function format(elem, caret_pos) {
        var unmasked = _this_.getUnmaskedValue(elem);
        var masked = _this_.maskString(elem, unmasked);

        elem.value = masked;

        if (undefined !== typeof caret_pos) {
            caret_pos = "end" === caret_pos ? masked.length : caret_pos;
            moveCaret(elem, caret_pos);
        }
    }

    /**
     * Callback for the keydown keyboard event
     * 
     * @param event
     *            KeyboardEvent
     */
    function onKeyDown(event) {

        if (_this_.wait) {
            event.preventDefault();
            return;
        }

        var elem = event.currentTarget;
        var data = getDefaultData(elem.dataset);
        var key = event.key;
        var caret_pos = getCaretPosition(elem);
        var offset;

        // not in control & navigation keys
        if (!(event.ctrlKey || event.shiftKey) && NAV_KEYS.indexOf(key) < 0) {
            if (!new RegExp(data["pattern"]).test(key)) {
                event.preventDefault();
            }

            // strict mode => don"t exceed the mask length
            if (data["strict"] === "true" && elem.value.length >= data["mask"].length) {
                if (window.getSelection().rangeCount <= 1) {
                    event.preventDefault();
                }
            }
        }

        // backspace near a mask separator
        if (false !== caret_pos) {
            if (KEY_BKSP === key && data["mask"][caret_pos - 1] !== _this_.mask_symbol) {
                // try to eliminate all mask separators till the next valid char
                offset = 0;
                while (caret_pos && data["mask"][caret_pos - 1] !== _this_.mask_symbol) {
                    caret_pos -= 1;
                    offset += 1;
                }

                if (offset) {
                    elem.value = elem.value.substr(0, caret_pos - 1) + elem.value.substr(caret_pos + offset);

                    format(elem, caret_pos);

                    event.preventDefault();
                }
            }

            // delete near a mask separator
            if (KEY_DEL === key && data["mask"][caret_pos] !== _this_.mask_symbol) {
                // try to eliminate all mask separators till the next valid char
                offset = 0;
                while (data["mask"][caret_pos] !== _this_.mask_symbol) {
                    caret_pos += 1;
                    offset += 1;
                }

                if (offset) {
                    elem.value = elem.value.substr(0, caret_pos - offset) + elem.value.substr(caret_pos + 1);

                    format(elem, caret_pos - offset);

                    event.preventDefault();
                }
            }

            // left arrow
            if (KEY_LEFT === key && data["mask"][caret_pos - 1] !== _this_.mask_symbol) {
                offset = 0;
                while (caret_pos && data["mask"][caret_pos - 1] !== _this_.mask_symbol) {
                    caret_pos -= 1;
                    offset += 1;
                }
                moveCaret(elem, caret_pos + 1);
            }

            // right arrow
            if (KEY_RIGHT === key && data["mask"][caret_pos + 1] !== _this_.mask_symbol) {
                offset = 0;
                while (caret_pos && data["mask"][caret_pos + 1] !== _this_.mask_symbol) {
                    caret_pos += 1;
                    offset += 1;
                }
                moveCaret(elem, caret_pos);
            }
        }

        _this_.wait = NAV_KEYS.indexOf(key) < 0;
    }

    /**
     * Callback for the keyup keyboard event
     * 
     * @param event
     *            KeyboardEvent
     */
    function onKeyUp(event) {
        var elem = event.currentTarget;
        var data = getDefaultData(elem.dataset);
        var caret_pos = getCaretPosition(elem);
        var key = event.key;
        var string = elem.value;
        var pasteKeys = [ "v", "V" ];
        var cutKeys = [ "x", "X" ];
        var ctrlFnKeys = [ "a", "A", "c", "C" ].concat(pasteKeys).concat(cutKeys);

        // allow Ctrl-A and Ctrl-V
        if (event.ctrlKey) {
            if (ctrlFnKeys.indexOf(key) >= 0) {
                if (pasteKeys.indexOf(key) >= 0) {
                    format(elem, "end");
                }
                _this_.wait = false;
                return;
            }
        } else if (event.shiftKey) {
            // allow shift-TAB
            if (key === KEY_TAB) {
                _this_.wait = false;
                return;
            }
        } else {
            if (NAV_KEYS.indexOf(key) < 0 && false !== caret_pos) {
                // when the caret is positioned somewhere inside the string
                if (caret_pos < string.length) {
                    format(elem, "end");
                }

                // when the caret is positioned on the mask separator position advance the caret to the next mask symbol
                var t = "";
                while (caret_pos < data["mask"].length && data["mask"][caret_pos] !== _this_.mask_symbol) {
                    t += data["mask"][caret_pos];
                    caret_pos += 1;
                }
                if (t.length) {
                    elem.value += t;
                    moveCaret(elem, caret_pos + 1);
                }
            }
        }

        _this_.wait = false;
    }

    /**
     * Mask the given string by using the current `_this_` element mask definition
     * 
     * @param elem
     *            The DOM element which value is to be masked
     * @param string
     *            The string to mask
     * @return Returns the masked string
     */
    _this_.maskString = function(elem, string) {
        var i;
        var data = getDefaultData(elem.dataset);
        var strict;

        strict = undefined === typeof strict ? true : strict;

        var mask_count = 0;
        var offset = 0;
        var head = 0;

        var output = "";

        // the final string may include the mask separators
        for (i = 0; !strict && i < data["mask"].length; i += 1) {
            offset += data["mask"][i] !== _this_.mask_symbol ? 1 : 0;
        }

        for (i = 0; i < Math.max(string.length, data["mask"].length) + offset; i += 1) {
            if ((strict && i >= data["mask"].length) || (i >= string.length + mask_count)) {
                break;
            }
            if (i < data["mask"].length && data["mask"][i] !== _this_.mask_symbol) {
                output += data["mask"][i];
                mask_count += 1;
            } else {
                if (head < string.length) {
                    output += string[head];
                } else {
                    output += data["mask"][i];
                    mask_count += 1;
                }
                head += 1;
            }
        }

        return output;
    };

    /**
     * Removes those chars that represents the mask
     * 
     * @param elem
     *            The DOM element which value is unmasked
     */
    _this_.getUnmaskedValue = function(elem) {
        var string = elem.value;
        var data = getDefaultData(elem.dataset);
        var strict = undefined === typeof data["strict"] ? true : data["strict"];
        var i;

        var output = "";
        for (i = 0; i < Math.max(string.length, data["mask"].length); i += 1) {
            if (i >= string.length) {
                break;
            }
            if (i < data["mask"].length) {
                if (new RegExp(data["pattern"]).test(string[i])) {
                    output += string[i];
                }/*
                     * else if (data.mask[i] !== _this_.mask_symbol) { continue; }
                     */
            } else {
                break;
            }
        }

        // if string longer than mask, get the rest fragment of string
        if (strict !== "true") {
            output += string.slice(data["mask"].length);
        }
        return output;
    };

    /**
     * Initialize the inputs for handling the mask events
     */
    _this_.init = function() {
        // process all the inputs
        Object.keys(_this_.inputs).forEach(function(selector) {
            var prop = getDefaultData(_this_.inputs[selector]);
            var selected_elements = document.querySelectorAll(selector);

            // add the keydown|keyup listeners to each selected item
            Object.keys(selected_elements).forEach(function(index) {

                var elem = selected_elements[index];

                // it seems there is another running instance that already attached to _this_ element
                if (elem.getAttribute("plugin") === _this_.name) {
                    return;
                }

                var elem_data = {
                    "mask" : prop["mask"] || elem.getAttribute("placeholder"),
                    "pattern" : prop["pattern"] || elem.getAttribute("pattern"),
                    "strict" : prop["strict"].toString(),
                    "plugin" : _this_.name
                };
                // store the mask within element dataset
                Object.keys(elem_data).forEach(function(p) {
                    elem.dataset[p] = elem_data[p];
                });

                // prevent key actions
                elem.addEventListener("keydown", onKeyDown);

                // process key inputs
                elem.addEventListener("keyup", onKeyUp);

            });
        });
    };

    if (_this_.autoinit) {
        _this_.init();
    }

    return _this_;
}
window["InputMask"] = InputMask;
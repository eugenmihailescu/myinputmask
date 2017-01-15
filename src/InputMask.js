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

    // /////////////////////////////
    // private properties
    // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var _this_ = this;
    var inputs = config.inputs || {};
    var mask_symbol = config.mask_symbol || "_";
    var autoinit = config.autoinit || true;
    var wait = false;

    // /////////////////////////////
    // private methods
    // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\

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
        if (end === _this_.UNDEF) {
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
            range.moveEnd(_this_.CHAR, end);
            range.moveStart(_this_.CHAR, start);
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
        if (_this_.UNDEF === typeof element) {
            return false;
        }

        var pos = 0;
        if (element.selectionStart) {
            pos = element.selectionStart;
        } else if (document.selection) {
            element.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart(_this_.CHAR, -element.value.length);
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
        var masked = maskString(elem, unmasked);

        elem.value = masked;

        if (_this_.UNDEF !== typeof caret_pos) {
            caret_pos = _this_.END === caret_pos ? masked.length : caret_pos;
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

        if (wait) {
            event.preventDefault();
            return;
        }

        var elem = event.currentTarget;
        var data = getDefaultData(elem.dataset);
        var key = event.key;
        var caret_pos = getCaretPosition(elem);
        var offset;

        // not in control & navigation keys
        if (!(event.ctrlKey || event.shiftKey) && _this_.NAV_KEYS.indexOf(key) < 0) {
            if (!new RegExp(data[_this_.pattern]).test(key)) {
                event.preventDefault();
            }

            // strict mode => don"t exceed the mask length
            if (data[_this_.strict] === "true" && elem.value.length >= data[_this_.mask].length) {
                if (window.getSelection().rangeCount <= 1) {
                    event.preventDefault();
                }
            }
        }

        // backspace near a mask separator
        if (false !== caret_pos) {
            if (_this_.KEY_BKSP === key && data[_this_.mask][caret_pos - 1] !== mask_symbol) {
                // try to eliminate all mask separators till the next valid char
                offset = 0;
                while (caret_pos && data[_this_.mask][caret_pos - 1] !== mask_symbol) {
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
            if (_this_.KEY_DEL === key && data[_this_.mask][caret_pos] !== mask_symbol) {
                // try to eliminate all mask separators till the next valid char
                offset = 0;
                while (data[_this_.mask][caret_pos] !== mask_symbol) {
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
            if (_this_.KEY_LEFT === key && data[_this_.mask][caret_pos - 1] !== mask_symbol) {
                offset = 0;
                while (caret_pos && data[_this_.mask][caret_pos - 1] !== mask_symbol) {
                    caret_pos -= 1;
                    offset += 1;
                }
                moveCaret(elem, caret_pos + 1);
            }

            // right arrow
            if (_this_.KEY_RIGHT === key && data[_this_.mask][caret_pos + 1] !== mask_symbol) {
                offset = 0;
                while (caret_pos && data[_this_.mask][caret_pos + 1] !== mask_symbol) {
                    caret_pos += 1;
                    offset += 1;
                }
                moveCaret(elem, caret_pos);
            }
        }

        wait = _this_.NAV_KEYS.indexOf(key) < 0;
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

        // allow Ctrl-A and Ctrl-V
        if (event.ctrlKey) {
            if (_this_.CTRL_FN_KEYS.indexOf(key) >= 0) {
                if (_this_.PASTE_KEYS.indexOf(key) >= 0) {
                    format(elem, _this_.END);
                }
                wait = false;
                return;
            }
        } else if (event.shiftKey) {
            // allow shift-TAB
            if (key === _this_.KEY_TAB) {
                wait = false;
                return;
            }
        } else {
            if (_this_.NAV_KEYS.indexOf(key) < 0 && false !== caret_pos) {
                // when the caret is positioned somewhere inside the string
                if (caret_pos < string.length) {
                    format(elem, _this_.END);
                }

                // when the caret is positioned on the mask separator position advance the caret to the next mask symbol
                var t = "";
                while (caret_pos < data[_this_.mask].length && data[_this_.mask][caret_pos] !== mask_symbol) {
                    t += data[_this_.mask][caret_pos];
                    caret_pos += 1;
                }
                if (t.length) {
                    elem.value += t;
                    moveCaret(elem, caret_pos + 1);
                }
            }
        }

        wait = false;
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
    function maskString(elem, string) {
        var i;
        var data = getDefaultData(elem.dataset);
        var strict;

        strict = _this_.UNDEF === typeof strict ? true : strict;

        var mask_count = 0;
        var offset = 0;
        var head = 0;

        var output = "";

        // the final string may include the mask separators
        for (i = 0; !strict && i < data[_this_.mask].length; i += 1) {
            offset += data[_this_.mask][i] !== mask_symbol ? 1 : 0;
        }

        for (i = 0; i < Math.max(string.length, data[_this_.mask].length) + offset; i += 1) {
            if ((strict && i >= data[_this_.mask].length) || (i >= string.length + mask_count)) {
                break;
            }
            if (i < data[_this_.mask].length && data[_this_.mask][i] !== mask_symbol) {
                output += data[_this_.mask][i];
                mask_count += 1;
            } else {
                if (head < string.length) {
                    output += string[head];
                } else {
                    output += data[_this_.mask][i];
                    mask_count += 1;
                }
                head += 1;
            }
        }

        return output;
    }

    /**
     * Initialize the inputs for handling the mask events
     */
    function init() {
        // process all the inputs
        Object.keys(inputs).forEach(function(selector) {
            var prop = getDefaultData(inputs[selector]);
            var selected_elements = document.querySelectorAll(selector);

            // add the keydown|keyup listeners to each selected item
            Object.keys(selected_elements).forEach(function(index) {

                var elem = selected_elements[index];

                // it seems there is another running instance that already attached to _this_ element
                if (elem.getAttribute(_this_.plugin) === _this_.name) {
                    return;
                }

                var elem_data = {
                    "mask" : prop[_this_.mask] || elem.getAttribute("placeholder"),
                    "pattern" : prop[_this_.pattern] || elem.getAttribute(_this_.pattern),
                    "strict" : prop[_this_.strict].toString(),
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
    }

    // /////////////////////////////
    // public methods
    // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\

    /**
     * Removes those chars that represents the mask
     * 
     * @param elem
     *            The DOM element which value is unmasked
     */
    _this_.getUnmaskedValue = function(elem) {
        var string = elem.value;
        var data = getDefaultData(elem.dataset);
        var strict = _this_.UNDEF === typeof data[_this_.strict] ? true : data[_this_.strict];
        var i;

        var output = "";
        for (i = 0; i < Math.max(string.length, data[_this_.mask].length); i += 1) {
            if (i >= string.length) {
                break;
            }
            if (i < data[_this_.mask].length) {
                if (new RegExp(data[_this_.pattern]).test(string[i])) {
                    output += string[i];
                }
            } else {
                break;
            }
        }

        // if string longer than mask, get the rest fragment of string
        if (strict !== "true") {
            output += string.slice(data[_this_.mask].length);
        }
        return output;
    };

    if (autoinit) {
        init();
    }

    return _this_;
}

// /////////////////////////////
// class constants
// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\
InputMask.prototype.UNDEF = "undefined";
InputMask.prototype.name = "InputMaskPlugin";
InputMask.prototype.CHAR = "character";
InputMask.prototype.END = "end";

InputMask.prototype.KEY_BKSP = "Backspace";
InputMask.prototype.KEY_DEL = "Delete";
InputMask.prototype.KEY_TAB = "Tab";
InputMask.prototype.KEY_LEFT = "ArrowLeft";
InputMask.prototype.KEY_RIGHT = "ArrowRight";
InputMask.prototype.NAV_KEYS = [ "Shift", "Control", "Home", "End", "CapsLock", InputMask.prototype.KEY_LEFT,
        InputMask.prototype.KEY_RIGHT, InputMask.prototype.KEY_DEL, InputMask.prototype.KEY_BKSP, InputMask.prototype.KEY_TAB ];

InputMask.prototype.PASTE_KEYS = [ "v", "V" ];
InputMask.prototype.CUT_KEYS = [ "x", "X" ];
InputMask.prototype.CTRL_FN_KEYS = [ "a", "A", "c", "C" ].concat(InputMask.prototype.PASTE_KEYS).concat(
        InputMask.prototype.CUT_KEYS);

InputMask.prototype.pattern = "pattern";
InputMask.prototype.strict = "strict";
InputMask.prototype.mask = "mask";
InputMask.prototype.plugin = "plugin";

window["InputMask"] = InputMask;
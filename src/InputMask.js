/**
 * Adds input mask functionality to your HTML inputs elements.
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
    var UNDEF = "undefined";
    var CHAR = "character";

    var KEY_BKSP = "Backspace";
    var KEY_DEL = "Delete";
    var KEY_TAB = "Tab";
    var NAV_KEYS = [ "Shift", "Control", "Home", "End", "ArrowLeft", "ArrowRight", "CapsLock", KEY_DEL, KEY_BKSP, KEY_TAB ];

    /**
     * Populates the data with the default properties if not already existing
     * 
     * @prop data Object of data properties
     */
    function getDefaultData(data) {
        data.mask = data.mask || '';
        data.pattern = data.pattern || '.';
        data.strict = data.strict || true;

        return data;
    }

    /**
     * Get the caret position within the given input element
     * 
     * @param element
     *            The selection element
     * @return The caret position within the given input element
     */
    function getCaretPosition(element) {
        if (UNDEF === typeof element) {
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
     * Select a given range within the current `_this_` element
     * 
     * @param start
     *            The starting index for selection
     * @param end
     *            The last index of selection
     */
    function selectRange(start, end) {
        if (end === undefined) {
            end = start;
        }
        if (_this_.selectionStart) {
            _this_.selectionStart = start;
            _this_.selectionEnd = end;
        } else if (_this_.setSelectionRange) {
            _this_.setSelectionRange(start, end);
        } else if (_this_.createTextRange) {
            var range = _this_.createTextRange();
            range.collapse(true);
            range.moveEnd(CHAR, end);
            range.moveStart(CHAR, start);
            range.select();
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

        // not in control & navigation keys
        if (!(event.ctrlKey || event.shiftKey) && NAV_KEYS.indexOf(key) < 0) {
            if (!new RegExp(data['pattern']).test(key)) {
                event.preventDefault();
            }

            // strict mode => don"t exceed the mask length
            if (data['strict'] === 'true' && elem.value.length >= data['mask'].length) {
                if (window.getSelection().rangeCount <= 1) {
                    event.preventDefault();
                }
            }
        }
        // backspace near a mask separator
        if (false !== caret_pos) {
            if (KEY_BKSP === key && data['mask'][caret_pos - 1] !== _this_.mask_symbol) {
                selectRange.call(elem, caret_pos - 1, caret_pos - 1);
            } else {
                // delete near a mask separator
                if (KEY_DEL === key && data['mask'][caret_pos] !== _this_.mask_symbol) {
                    selectRange.call(elem, caret_pos + 1, caret_pos + 1);
                }
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
        var ctrlFnKeys = [ "a", "A", "v", "V" ];

        // allow Ctrl-A and Ctrl-V
        if (event.ctrlKey) {
            if (ctrlFnKeys.indexOf(key) >= 0) {
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
                if (caret_pos < string.length) {

                    var unmasked = _this_.getUnmaskedValue.call(elem);
                    var masked = _this_.maskString.call(elem, unmasked);

                    elem.value = masked;
                    caret_pos = masked.length;
                }

                if (caret_pos < data['mask'].length && data['mask'][caret_pos] !== _this_.mask_symbol) {
                    elem.value = string + data['mask'][caret_pos];
                    selectRange.call(elem, caret_pos + 1, caret_pos + 1);
                }
            }
        }

        _this_.wait = false;
    }

    /**
     * Mask the given string by using the current `_this_` element mask definition
     * 
     * @param string
     *            The string to mask
     * @return Returns the masked string
     */
    _this_.maskString = function(string) {
        var i;
        var elem = this;
        var data = getDefaultData(elem.dataset);
        var strict;

        strict = UNDEF === typeof strict ? true : strict;

        var mask_count = 0;
        var offset = 0;
        var head = 0;

        var output = "";

        // the final string may include the mask separators
        for (i = 0; !strict && i < data['mask'].length; i += 1) {
            offset += data['mask'][i] !== _this_.mask_symbol ? 1 : 0;
        }

        for (i = 0; i < Math.max(string.length, data['mask'].length) + offset; i += 1) {
            if ((strict && i >= data['mask'].length) || (i >= string.length + mask_count)) {
                break;
            }
            if (i < data['mask'].length && data['mask'][i] !== _this_.mask_symbol) {
                output += data['mask'][i];
                mask_count += 1;
            } else {
                if (head < string.length) {
                    output += string[head];
                } else {
                    output += data['mask'][i];
                    mask_count += 1;
                }
                head += 1;
            }
        }

        return output;
    };

    /**
     * Removes those chars that represents the mask
     */
    _this_.getUnmaskedValue = function() {
        var elem = this;
        var string = elem.value;
        var data = getDefaultData(elem.dataset);
        var strict = UNDEF === typeof data['strict'] ? true : data['strict'];
        var i;

        var output = "";
        for (i = 0; i < Math.max(string.length, data['mask'].length); i += 1) {
            if (i >= string.length) {
                break;
            }
            if (i < data['mask'].length) {
                if (new RegExp(data['pattern']).test(string[i])) {
                    output += string[i];
                }/*
                     * else if (data.mask[i] !== _this_.mask_symbol) { continue; }
                     */
            } else {
                break;
            }
        }

        // if string longer than mask, get the rest fragment of string
        if (strict !== 'true') {
            output += string.slice(data['mask'].length);
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
                    'mask' : prop['mask'] || elem.getAttribute("placeholder"),
                    'pattern' : prop['pattern'] || elem.getAttribute("pattern"),
                    'strict' : prop['strict'].toString(),
                    'plugin' : _this_.name
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
window['InputMask'] = InputMask;
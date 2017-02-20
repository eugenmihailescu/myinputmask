/**
 * Adds input mask functionality to your HTML inputs elements.
 * 
 * @author Eugen Mihailescu <eugenmihailescux@gmail.com>
 * @license {@link https://www.gnu.org/licenses/gpl-3.0.txt|GPLv3}
 * @version 1.0
 * 
 * @class
 * @since 1.0
 * @param {Object}
 *            config - An object with two properties: an list of input elements and optionally the mask symbol.
 * 
 * @returns {Object} - Returns the object instance
 */
function InputMask(config) {
    "use strict";

    // /////////////////////////////
    // private properties
    // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    var that = this;
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
     * @since 1.0
     * @param {Object}
     *            data - Object of data properties
     * @returns {Object} Returns the altered object
     */
    function getDefaultData(data) {
        data.mask = data.mask || "";
        data.pattern = data.pattern || ".";
        data.strict = data.strict || true;

        return data;
    }

    /**
     * Select a given range within the current `that` element
     * 
     * @since 1.0
     * @param {number}
     *            start - The starting index for selection
     * @param {number=}
     *            end - The last index of selection
     */
    function selectRange(elem, start, end) {
        if (end === that.UNDEF) {
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
            range.moveEnd(that.CHAR, end);
            range.moveStart(that.CHAR, start);
            range.select();
        }
    }

    /**
     * Get the caret position within the given input element
     * 
     * @since 1.0
     * @param {Object=}
     *            element - The selection HTML {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|element}
     * 
     * @returns {number} - The caret position within the given input element
     */
    function getCaretPosition(element) {
        if (that.UNDEF === typeof element) {
            return false;
        }

        var pos = 0;
        if (element.selectionStart) {
            pos = element.selectionStart;
        } else if (document.selection) {
            element.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart(that.CHAR, -element.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }

    /**
     * Move the input's caret to the specified position
     * 
     * @since 1.0
     * @param {Object}
     *            elem - The input HTML {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|element} where the
     *            caret is moved
     * @param {number}
     *            position - The new position of the caret
     */
    function moveCaret(elem, position) {
        selectRange(elem, position, position);
    }

    /**
     * Reformat the input element
     * 
     * @since 1.0
     * @param {Object}
     *            elem - The input HTML {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|element} which values
     *            is (re)formatted
     * @param {number=}
     *            caret_pos - The new position of the caret, if specified
     */
    function format(elem, caret_pos) {
        var unmasked = that.getUnmaskedValue(elem);
        var masked = maskString(elem, unmasked);

        elem.value = masked;

        if (that.UNDEF !== typeof caret_pos) {
            caret_pos = that.END === caret_pos ? masked.length : caret_pos;
            moveCaret(elem, caret_pos);
        }
    }

    /**
     * Callback for the keydown keyboard event
     * 
     * @since 1.0
     * @param {Object}
     *            event - The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent|KeyboardEvent}
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
        if (!(event.ctrlKey || event.shiftKey) && that.NAV_KEYS.indexOf(key) < 0) {
            if (!new RegExp(data[that.pattern]).test(key)) {
                event.preventDefault();
            }

            // strict mode => don"t exceed the mask length
            if (data[that.strict] === "true" && elem.value.length >= data[that.mask].length) {
                if (window.getSelection().rangeCount <= 1) {
                    event.preventDefault();
                }
            }
        }

        // backspace near a mask separator
        if (false !== caret_pos) {
            if (that.KEY_BKSP === key && data[that.mask][caret_pos - 1] !== mask_symbol) {
                // try to eliminate all mask separators till the next valid char
                offset = 0;
                while (caret_pos && data[that.mask][caret_pos - 1] !== mask_symbol) {
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
            if (that.KEY_DEL === key && data[that.mask][caret_pos] !== mask_symbol) {
                // try to eliminate all mask separators till the next valid char
                offset = 0;
                while (data[that.mask][caret_pos] !== mask_symbol) {
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
            if (that.KEY_LEFT === key && data[that.mask][caret_pos - 1] !== mask_symbol) {
                offset = 0;
                while (caret_pos && data[that.mask][caret_pos - 1] !== mask_symbol) {
                    caret_pos -= 1;
                    offset += 1;
                }
                moveCaret(elem, caret_pos + 1);
            }

            // right arrow
            if (that.KEY_RIGHT === key && data[that.mask][caret_pos + 1] !== mask_symbol) {
                offset = 0;
                while (caret_pos && data[that.mask][caret_pos + 1] !== mask_symbol) {
                    caret_pos += 1;
                    offset += 1;
                }
                moveCaret(elem, caret_pos);
            }
        }

        wait = that.NAV_KEYS.indexOf(key) < 0;
    }

    /**
     * Callback for the keyup keyboard event
     * 
     * @since 1.0
     * @param {Object}
     *            event - The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent|KeyboardEvent}
     */
    function onKeyUp(event) {
        var elem = event.currentTarget;
        var data = getDefaultData(elem.dataset);
        var caret_pos = getCaretPosition(elem);
        var key = event.key;
        var string = elem.value;

        // allow Ctrl-A and Ctrl-V
        if (event.ctrlKey) {
            if (that.CTRL_FN_KEYS.indexOf(key) >= 0) {
                if (that.PASTE_KEYS.indexOf(key) >= 0) {
                    format(elem, that.END);
                }
                wait = false;
                return;
            }
        } else if (event.shiftKey) {
            // allow shift-TAB
            if (key === that.KEY_TAB) {
                wait = false;
                return;
            }
        } else {
            if (that.NAV_KEYS.indexOf(key) < 0 && false !== caret_pos) {
                // when the caret is positioned somewhere inside the string
                if (caret_pos < string.length) {
                    format(elem, that.END);
                }

                // when the caret is positioned on the mask separator position advance the caret to the next mask symbol
                var t = "";
                while (caret_pos < data[that.mask].length && data[that.mask][caret_pos] !== mask_symbol) {
                    t += data[that.mask][caret_pos];
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
     * Mask the given string by using the current `that` element mask definition
     * 
     * @since 1.0
     * @param {Object}
     *            elem - The HTML {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|element} which value is to
     *            be masked
     * @param {string}
     *            string - The string to mask
     * @returns {string} - Returns the masked string
     */
    function maskString(elem, string) {
        var i;
        var data = getDefaultData(elem.dataset);
        var strict;

        strict = that.UNDEF === typeof strict ? true : strict;

        var mask_count = 0;
        var offset = 0;
        var head = 0;

        var output = "";

        // the final string may include the mask separators
        for (i = 0; !strict && i < data[that.mask].length; i += 1) {
            offset += data[that.mask][i] !== mask_symbol ? 1 : 0;
        }

        for (i = 0; i < Math.max(string.length, data[that.mask].length) + offset; i += 1) {
            if ((strict && i >= data[that.mask].length) || (i >= string.length + mask_count)) {
                break;
            }
            if (i < data[that.mask].length && data[that.mask][i] !== mask_symbol) {
                output += data[that.mask][i];
                mask_count += 1;
            } else {
                if (head < string.length) {
                    output += string[head];
                } else {
                    output += data[that.mask][i];
                    mask_count += 1;
                }
                head += 1;
            }
        }

        return output;
    }

    /**
     * Initialize the inputs for handling the mask events
     * 
     * @since 1.0
     */
    function init() {
        // process all the inputs
        Object.keys(inputs).forEach(function(selector) {
            var prop = getDefaultData(inputs[selector]);
            var selected_elements = document.querySelectorAll(selector);

            // add the keydown|keyup listeners to each selected item
            Object.keys(selected_elements).forEach(function(index) {

                var elem = selected_elements[index];

                // it seems there is another running instance that already attached to that element
                if (elem.getAttribute(that.plugin) === that.name) {
                    return;
                }

                var elem_data = {
                    "mask" : prop[that.mask] || elem.getAttribute("placeholder"),
                    "pattern" : prop[that.pattern] || elem.getAttribute(that.pattern),
                    "strict" : prop[that.strict].toString(),
                    "plugin" : that.name
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
     * @since 1.0
     * @param {Object}
     *            elem - The HTML {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|element} which value is
     *            unmasked
     * @returns {string} - Returns the unmasked value
     */
    that.getUnmaskedValue = function(elem) {
        var string = elem.value;
        var data = getDefaultData(elem.dataset);
        var strict = that.UNDEF === typeof data[that.strict] ? true : data[that.strict];
        var i;

        var output = "";
        for (i = 0; i < Math.max(string.length, data[that.mask].length); i += 1) {
            if (i >= string.length) {
                break;
            }
            if (i < data[that.mask].length) {
                if (new RegExp(data[that.pattern]).test(string[i])) {
                    output += string[i];
                }
            } else {
                break;
            }
        }

        // if string longer than mask, get the rest fragment of string
        if (strict !== "true") {
            output += string.slice(data[that.mask].length);
        }
        return output;
    };

    if (autoinit) {
        init();
    }

    return that;
}

// /////////////////////////////
// class constants
// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.UNDEF = "undefined";

/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.name = "InputMaskPlugin";

/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.CHAR = "character";

/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.END = "end";

/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.KEY_BKSP = "Backspace";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.KEY_DEL = "Delete";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.KEY_TAB = "Tab";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.KEY_LEFT = "ArrowLeft";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.KEY_RIGHT = "ArrowRight";

/**
 * @since 1.0
 * @constant {string[]}
 * @default
 */
InputMask.prototype.NAV_KEYS = [ "Shift", "Control", "Home", "End", "CapsLock", InputMask.prototype.KEY_LEFT,
        InputMask.prototype.KEY_RIGHT, InputMask.prototype.KEY_DEL, InputMask.prototype.KEY_BKSP, InputMask.prototype.KEY_TAB ];

/**
 * @since 1.0
 * @constant {string[]}
 * @default
 */
InputMask.prototype.PASTE_KEYS = [ "v", "V" ];
/**
 * @since 1.0
 * @constant {string[]}
 * @default
 */
InputMask.prototype.CUT_KEYS = [ "x", "X" ];
/**
 * @since 1.0
 * @constant {string[]}
 * @default
 */
InputMask.prototype.CTRL_FN_KEYS = [ "a", "A", "c", "C" ].concat(InputMask.prototype.PASTE_KEYS).concat(
        InputMask.prototype.CUT_KEYS);

/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.pattern = "pattern";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.strict = "strict";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.mask = "mask";
/**
 * @since 1.0
 * @constant {string}
 * @default
 */
InputMask.prototype.plugin = "plugin";

window["InputMask"] = InputMask;
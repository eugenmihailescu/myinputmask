# my-input-mask
Input mask plugin for JavaScript

A lightweight WYSIWYG plugin (only 2K minimized) that adds input mask functionality to the HTML inputs elements.

## Features
- formats multiple inputs at once (via selector) as per input's mask definition (see `mask`)
- inputs accept only chars withing a specified range|pattern (see `pattern`)
- limits the length of input value by the mask length (see `strict` attribute)
- supports almost all editor functional keys (navigational keys, functional keys, etc)
- lightweight (3K minimized, ie. 400 lines of formatted source including comments)
- JSLint compliant
- supports full code minimification without breaking its functionality (see Google's [closure-compiler](http://closure-compiler.appspot.com/home)) 
 
## Requirements
+ JavaScript capable browser (eg. IE9+, FF4, Chrome5, Opera12, Safari5)

## How it works
The plugin class is a JavaScript function called `InputMask` which binds some key events (eg. keydown, keyup) to the configured/given input elements. And that's it!

To tell the function what are your inputs and how to mask them it accepts a configuration object as first argument with the following definition:
```javascript
object = {
  inputs: {input_def1, input_def2,..},
  mask_symbol: "_",
  autoinit: boolean
}
```
where
 - `inputs` is a list of `input_def` which have the following definition:
   - an `input_def` element is just an object with three properties:
     - `mask` : a string that denotes the input mask (when not specified the input's [placeholder attribute](https://developer.mozilla.org/en/docs/Web/HTML/Element/input#attr-placeholder) is used if exists)
     - `pattern` : a string that represents the character class accepted for inputs, eg. *`[0-9A-Z]`* or *`[^@&!]`* (besides the home|end|left|right|delete|backspace|caps-lock|tab|shift-tab|ctrl-a|ctrl-v keys which are allowed by default)
     - `strict` : a boolean which tells the function if the mask length should limit the input value length (`true`) or not (`false`). When not specified it is `true` by default.
- `mask_symbol`, if specified, is the mask char used within each input_def element (default to underscore "`_`")
- `autoinit` tells the class to auto-initialize automatically or manually, by calling its `init()` function.

*Example of an `input_def`*:
```javascript
var input_def = {
  "#a-phone-number" : {
    mask: "(___) ___-____", // where the underscore is the mask symbol
    pattern: "[0-9A-Z]", // only digits and caps letters
    strict: true // limits the value length to the mask length
  }
} 
```
Of course, you may have a dosen of inputs so you can just wrap them all into an object and pass that object (inline or as a variable) to the function constructor.
Note that by using a class selector (or alike) you may select multiple elements at once, and therefore apply the formating to all of them with only one input_def definition.
## Usage
A quick example of two input elements (a card number and *something* realy odd) and their mask definition:
```html
<!-- some plain html -->
<input id="my-selector" type="text">
<input name="whatever" type="tel" class="my-class">
```   
```javascript
// create an instance of our class that takes care of the rest
new InputMask({
  inputs: {
    '#my-selector': {
      mask: '____ ____ ____ ____',
      strict: true,
      pattern: '[0-9]'
    },
    'input[type=tel]': {
      mask: '___%___%___',
      strict: true,
      pattern: '[^@!&]'
    }
  },
  mask_symbol: '_' // when underscore is used we can actually omit this parameter
});
```
will mask the input editor with Id `#my-selector` and any input with `type=tel`.

## Caveat Emptor
1. When you'll read the input value you will find that its value includes also those mask separators that were introduced by the mask (not only the text that was physically entered by the end-user). That is something expected because the input value was physically altered by the plug-in. To overcome this you may read the input value using a special function (see `getUnmaskedValue`) provided by class
2. The insert key will not work as in a regular editor (this may, however, be fixed in a future release).
3. Does not support multiple masks for the same input which could vary based on different regex validation expressions (see card number which masks may differ for different card brands).

### How to retrieve the unmasked value
Since the input value is masked by using a given mask/format you cannot read directly the DOM element's value and retrieve its unmasked value. However, there is a special function to deal with these situations: `getUnmaskedValue(input)` where `input` is the DOM input element for which you want to retrieve the unmasked value.

## Documentation
The JavaScript source files are annotated according to JSDoc specification and thus the source documentation can be produced on the fly by using the {@link http://usejsdoc.org/|JSDoc} tool.

In order to generate the JSDoc documentation you should follow the steps below. In case you want to use the JSDoc default template skip the step (1) below.
1. install your preferred JSDoc {@link http://bfy.tw/ABvL|template} (eg. `npm install {@link https://www.npmjs.com/package/interledger-jsdoc-template|minami}`)
  - make sure you update the `opts.template` property with the path to the installed JSDoc template in project's `conf.json` file
2. run the following command at the terminal: `jsdoc -c path-to-conf.json`  
  - this will create a `jsdoc` folder that will contain the auto-generated JSDoc documentation for the JavaScript source files
  
**Feedback** : drop me a line at eugenmihailescux at gmail dot com
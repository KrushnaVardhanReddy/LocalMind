;; functions
(function_definition
  declarator: (function_declarator
    declarator: (identifier) @name)) @function

(function_definition
  declarator: (function_declarator
    declarator: (field_identifier) @name)) @method

;; classes
(class_specifier
  name: (type_identifier) @name) @class

(struct_specifier
  name: (type_identifier) @name) @class

;; imports
(preproc_include) @import

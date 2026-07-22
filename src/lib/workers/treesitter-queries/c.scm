;; functions
(function_definition
  declarator: (function_declarator
    declarator: (identifier) @name)) @function

;; structs
(struct_specifier
  name: (type_identifier) @name) @class

;; imports
(preproc_include) @import

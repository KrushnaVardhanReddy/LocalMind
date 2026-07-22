;; functions
(function_declaration
  name: (identifier) @name) @function

(method_declaration
  name: (field_identifier) @name) @method

;; types / structs (used as classes)
(type_declaration
  (type_spec
    name: (type_identifier) @name
    type: (struct_type))) @class

(type_declaration
  (type_spec
    name: (type_identifier) @name
    type: (interface_type))) @class

;; imports
(import_spec) @import

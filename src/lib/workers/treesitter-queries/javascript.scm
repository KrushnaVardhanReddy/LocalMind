;; functions
(function_declaration
  name: (identifier) @name) @function

(method_definition
  name: (property_identifier) @name) @method

(lexical_declaration
  (variable_declarator
    name: (identifier) @name
    value: [(arrow_function) (function_expression)])) @function

(variable_declaration
  (variable_declarator
    name: (identifier) @name
    value: [(arrow_function) (function_expression)])) @function

;; classes
(class_declaration
  name: (identifier) @name) @class

;; imports
(import_statement) @import

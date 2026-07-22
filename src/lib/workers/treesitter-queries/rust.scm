;; functions
(function_item
  name: (identifier) @name) @function

;; structs / traits (acting as classes)
(struct_item
  name: (type_identifier) @name) @class

(trait_item
  name: (type_identifier) @name) @class

(impl_item
  type: (type_identifier) @name) @class

;; imports
(use_declaration) @import

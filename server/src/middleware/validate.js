// Usage: router.post('/', validate(createProjectSchema), controller)
// The schema is z.object({ body, query, params }); parsed (cleaned) values land in req.valid.
// Unknown fields are stripped by zod, which protects against mass assignment.
export const validate = (schema) => (req, res, next) => {
  req.valid = schema.parse({ body: req.body, query: req.query, params: req.params });
  next();
};

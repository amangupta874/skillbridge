// Success responses always look like { data } or { data, meta } for paginated lists.
export const sendData = (res, data, status = 200) => res.status(status).json({ data });

export function sendPage(res, items, { page, limit, total }) {
  res.json({ data: items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

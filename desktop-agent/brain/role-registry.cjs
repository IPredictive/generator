const definitions = require("./roles.json");
class RoleRegistry {
  constructor(roles = definitions) {
    this.roles = new Map();
    for (const role of roles) this.register(role);
  }
  register(role) {
    if (!role || !/^[a-z][a-z0-9_-]*$/.test(role.id || "") || !role.name || !role.focus || !role.instruction) throw new TypeError("A role requires id, name, focus and instruction.");
    if (this.roles.has(role.id)) throw new Error("Duplicate role: " + role.id);
    this.roles.set(role.id, Object.freeze({ ...role }));
    return this.roles.get(role.id);
  }
  get(id) { return this.roles.get(id) || null; }
  list() { return Array.from(this.roles.values()); }
  select(ids) {
    if (!ids) return this.list();
    return ids.map(id => {
      const role = this.get(id);
      if (!role) throw new Error("Unknown specialist role: " + id);
      return role;
    });
  }
}
module.exports = { RoleRegistry };

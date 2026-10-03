// What a child or a leader is called in the app. Dependency-free.

// The nickname; without one the first name stands in for it. Children have
// `firstName`, leaders (`skautisPeople`, contacts) only a full `name`.
export const nicknameOf = (person) =>
  person?.nickname?.trim() ||
  person?.firstName?.trim() ||
  person?.name?.trim().split(/\s+/)[0] ||
  ''

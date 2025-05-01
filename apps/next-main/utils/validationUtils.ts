/**
 * Returns whether an email address is probably valid or not. It's hard to
 * tell whether every email is valid or not but this should be correct for
 * our use cases.
 *
 * @param {string} email The email address to check if valid or not.
 *
 * @returns {boolean}
 */
export const isEmailProbablyValid = (email: string): boolean => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

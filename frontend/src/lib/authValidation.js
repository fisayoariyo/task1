export function passwordValidationMessage(password) {
  const length = String(password ?? '').length
  if (length < 8 || length > 72) {
    return 'Password must be 8–72 characters.'
  }
  return null
}

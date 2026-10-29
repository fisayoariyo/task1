export const initialAuthState = { user: null, status: 'loading', error: null }

export function authReducer(state, action) {
  switch (action.type) {
    case 'session-loading':
      return { ...state, status: 'loading', error: null }
    case 'session-anonymous':
      return { user: null, status: 'anonymous', error: null }
    case 'session-error':
      return { ...state, status: 'error', error: action.error }
    case 'user-authenticated':
      return { user: action.user, status: 'authenticated', error: null }
    case 'logout-success':
      return { user: null, status: 'anonymous', error: null }
    default:
      return state
  }
}

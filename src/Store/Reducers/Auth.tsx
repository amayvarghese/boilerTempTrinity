export default function AuthReducer(state = false, action: any) {
  switch (action.type) {
    case "userLoggedIn":
      return true;
    case "userLoggedOut":
      return false;
    default:
      return state;
  }
}

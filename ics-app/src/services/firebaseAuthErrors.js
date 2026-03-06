export function formatFirebaseAuthError(error, fallbackMessage = "Authentication failed") {
  const code = error?.code || ""

  switch (code) {
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase Auth. Add your domain in Firebase Console → Authentication → Settings → Authorized domains."
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled in Firebase Authentication settings."
    case "auth/email-already-in-use":
      return "This email is already in use. Try logging in instead."
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters."
    case "auth/invalid-email":
      return "Please enter a valid email address."
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password."
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    default:
      return error?.message || fallbackMessage
  }
}
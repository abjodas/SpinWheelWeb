import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

// Sign in with email and password
export const signInUser = async (email, password) => {
  try {
    console.log('Attempting to sign in user with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully:', userCredential.user.uid);
    return {
      success: true,
      user: userCredential.user,
      message: 'Successfully signed in!'
    };
  } catch (error) {
    console.error('Error signing in user:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code)
    };
  }
};


// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Successfully signed out!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: 'Error signing out'
    };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/admin-restricted-operation':
      return 'This operation is restricted. Please contact support.';
    case 'auth/argument-error':
      return 'Invalid authentication configuration.';
    case 'auth/app-not-authorized':
      return 'App not authorized to use Firebase Authentication.';
    case 'auth/configuration-not-found':
      return 'Firebase configuration error. Please contact support.';
    default:
      console.error('Unhandled auth error code:', errorCode);
      return `Authentication error (${errorCode}). Please try again or contact support.`;
  }
};
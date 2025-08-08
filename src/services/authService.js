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
      message: 'Connexion réussie!'
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
      message: 'Déconnexion réussie!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: 'Erreur lors de la déconnexion'
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
      return 'Aucun compte trouvé avec cette adresse e-mail.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/invalid-email':
      return 'Veuillez saisir une adresse e-mail valide.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives échouées. Veuillez réessayer plus tard.';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Veuillez vérifier votre connexion.';
    case 'auth/invalid-credential':
      return 'Adresse e-mail ou mot de passe invalide.';
    case 'auth/operation-not-allowed':
      return 'Les comptes e-mail/mot de passe ne sont pas activés. Veuillez contacter le support.';
    case 'auth/admin-restricted-operation':
      return 'Cette opération est restreinte. Veuillez contacter le support.';
    case 'auth/argument-error':
      return 'Configuration d\'authentification invalide.';
    case 'auth/app-not-authorized':
      return 'Application non autorisée à utiliser l\'authentification Firebase.';
    case 'auth/configuration-not-found':
      return 'Erreur de configuration Firebase. Veuillez contacter le support.';
    default:
      console.error('Unhandled auth error code:', errorCode);
      return `Erreur d'authentification (${errorCode}). Veuillez réessayer ou contacter le support.`;
  }
};
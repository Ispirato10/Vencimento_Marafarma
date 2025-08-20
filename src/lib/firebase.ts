
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  "apiKey": "API_KEY",
  "authDomain": "marafarma-424419.firebaseapp.com",
  "projectId": "marafarma-424419",
  "storageBucket": "marafarma-424419.appspot.com",
  "messagingSenderId": "48805216142",
  "appId": "1:48805216142:web:61d432367185e7de2f219f"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };

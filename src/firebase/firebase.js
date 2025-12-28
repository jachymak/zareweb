import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTm9i9VQLao2PEKzy-vkQOIpuuAnuiiYg",
  authDomain: "zare-web.firebaseapp.com",
  projectId: "zare-web",
  storageBucket: "zare-web.appspot.com",
  messagingSenderId: "146735555123",
  appId: "1:146735555123:web:98d12abfa85325dcc87946",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export default db;

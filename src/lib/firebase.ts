import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Configuração do projeto Firebase "cconccordd".
// Chaves Web do Firebase são públicas por design (proteção real vem das
// Security Rules + App Check). Não colocar aqui: service account, Admin SDK,
// tokens privados ou qualquer credencial administrativa.
const firebaseConfig = {
  apiKey: 'AIzaSyCM0IlwHhrILAeovUc5dD_yKTFNgx_QuOA',
  authDomain: 'cconccordd.firebaseapp.com',
  databaseURL: 'https://cconccordd-default-rtdb.firebaseio.com',
  projectId: 'cconccordd',
  storageBucket: 'cconccordd.firebasestorage.app',
  messagingSenderId: '208770392183',
  appId: '1:208770392183:web:c089457ff4150de0542672',
  measurementId: 'G-NK83PNETFE',
} as const

// Singleton: evita dupla inicialização (StrictMode / HMR).
export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const firebaseDb = getDatabase(firebaseApp)

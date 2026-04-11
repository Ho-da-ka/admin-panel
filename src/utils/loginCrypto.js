import CryptoJS from 'crypto-js'

const LOGIN_AES_KEY = import.meta.env.VITE_LOGIN_AES_KEY || 'ZFLoginCryptoKey2026ForDemo12345'

function randomIvWordArray() {
  return CryptoJS.lib.WordArray.random(16)
}

export function encryptLoginPassword(password) {
  const iv = randomIvWordArray()
  const key = CryptoJS.enc.Utf8.parse(LOGIN_AES_KEY)
  const encrypted = CryptoJS.AES.encrypt(password, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  return {
    encryptedPassword: CryptoJS.enc.Base64.stringify(encrypted.ciphertext),
    iv: CryptoJS.enc.Base64.stringify(iv)
  }
}


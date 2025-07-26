import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, database } from './firebase';
import { ref, get } from 'firebase/database';
import './css/resetPassword.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    setMessage('');
    setError('');

    try {
      // Referencia a todos los usuarios
      const usuariosRef = ref(database, 'Usuarios');
      const snapshot = await get(usuariosRef);
      let emailExiste = false;

      // Recorrer los usuarios y buscar si existe el correo
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === email) {
          emailExiste = true;
        }
      });

      if (emailExiste) {
        await sendPasswordResetEmail(auth, email);
        setMessage('Revisa tu correo para restablecer tu contraseña.');
      } else {
        setError('Este correo no existe en nuestro sistema.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error. Intenta nuevamente.');
    }
  };

  return (
    <div className="reset-container">
      <h2>RESTABLECER CONTRASEÑA</h2>
      <p>Ingresa el correo con el que te registraste</p>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleReset}>Enviar enlace</button>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ResetPassword;

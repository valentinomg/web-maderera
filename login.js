import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, database } from './firebase';
import { ref, get, set, push } from 'firebase/database';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import './css/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const [isCustomEyeVisible, setIsCustomEyeVisible] = useState(true);

  useEffect(() => {
    document.body.classList.add('body-login');
    return () => {
      document.body.classList.remove('body-login');
    };
  }, []);
  

  useEffect(() => {
    const inputElement = document.createElement('input');
    inputElement.setAttribute('type', 'password');
    document.body.appendChild(inputElement);

    // Comprobar si el navegador ya muestra el ojo por defecto
    const isDefaultEyeVisible = inputElement.type === 'password' && inputElement.type !== 'text';

    setIsCustomEyeVisible(!isDefaultEyeVisible);
    document.body.removeChild(inputElement);
  }, []);

  const obtenerFechaHora = () => {
    const ahora = new Date();
  
    // Obtener la fecha en formato YYYY-MM-DD
    const fecha = ahora.toISOString().split("T")[0];
  
    // Obtener la hora en formato HH:MM:SS
    const hora = ahora.toLocaleTimeString("es-ES", { hour12: false });
  
    return `${fecha} | ${hora}`;
  };
  
  console.log(obtenerFechaHora()); // Ejemplo: "2025-03-08 | 14:30:45"
  

  const obtenerIP = async () => {
    try {
      const respuesta = await fetch("https://api64.ipify.org?format=json");
      const datos = await respuesta.json();
      return datos.ip; // Retorna la IP pública del usuario
    } catch (error) {
      console.error("Error al obtener la IP:", error);
      return "Desconocida";
    }
  };
  
  const saveUserSession = async (user) => {
    const ip = await obtenerIP(); // Obtener IP antes de guardar sesión
  
    const sessionRef = ref(database, `sesiones/${user.uid}`);
    await set(sessionRef, {
      email: user.email,
      inicioSesion: obtenerFechaHora(),
      ip: ip,
    });
    
  };

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = ref(database, `Usuarios/${user.uid}`);
      const snapshot = await get(userRef);
  
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setSuccessMessage("Login exitoso");
  
        // Guardar sesión en la BD
        await saveUserSession(user);
  
        // Redirección basada en el rol
        const userRole = userData.rol ? userData.rol.toLowerCase() : "";
        setTimeout(() => navigate(userRole === "administrador" || userRole === "empleado" ? '/panel' : '/'), 2000);
      } else {
        setError("No se encontraron datos del usuario.");
      }
    } catch (err) {
      if (err.code === 'auth/user-disabled') {
        setError("Tu cuenta ha sido deshabilitada. Por favor, contacta con el administrador.");
      } else {
        setError("Credenciales incorrectas o si no tiene cuenta, ¡Regístrese!");
      }
      setTimeout(() => setError(""), 3000);
    }
  };
  

  // 🔹 Inicio de sesión con Google
  const handleGoogleLogin = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserData(result.user);
    } catch (error) {
      setError("Error al iniciar sesión con Google.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 🔹 Inicio de sesión con Facebook
  const handleFacebookLogin = async () => {
    setError('');
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserData(result.user);
    } catch (error) {
      setError("Error al iniciar sesión con Facebook.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // 🔹 Guardar datos del usuario autenticado en Firebase
// 🔹 Guardar datos del usuario autenticado en Firebase
const saveUserData = async (user) => {
  const userRef = ref(database, `Usuarios/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    // Separar el nombre y apellido si están en displayName
    const nameParts = (user.displayName || user.email.split('@')[0]).split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' '); // Si hay más de un apellido, lo junta

    await set(userRef, {
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      rol: "cliente"
    });
  }

  setSuccessMessage("Login exitoso");

  // Guardar sesión en la BD
  await saveUserSession(user);

  setTimeout(() => navigate('/'), 2000);
};


  return (
    <div className="login-container">
      <h2 className="titulogin">¡Inicia sesión!</h2>
      <img src="/images/logomadera.jpg" alt="Logo" className="logologi" />
      <form onSubmit={handleLogin}>
        <input
          type="email"
          className="inpulogi"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="password-container">
          <input
            className="inpulogi"
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isCustomEyeVisible && (
            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          )}
        </div>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <button className="login-butto" type="submit">Entrar</button>
        <p className="forgot-password">
          <a href="/reset-password">¿Olvidaste tu contraseña? Recupérala</a>
        </p>
      </form>

      {/* 🔹 Separador */}
      <div className="separator">
        <span>Acceso rápido con</span>
      </div>

      {/* 🔹 Botones de Google y Facebook */}
      <div className="social-login">
        <button className="btn-google" onClick={handleGoogleLogin}>
          <FaGoogle className="icon" />
        </button>
{/*
<button className="btn-facebook" onClick={handleFacebookLogin}>
  <FaFacebook className="icon" />
</button>
*/}

      </div>

      <p className="register-link">
        ¿No tienes cuenta? <a href="/register">Regístrate ➜</a>
      </p>
    </div>
  );
};

export default Login;



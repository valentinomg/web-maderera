import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from './firebase'; 
import './css/registro.css'; 
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { FaGoogle } from 'react-icons/fa';



const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = 'body-register';
    return () => {
      document.body.className = '';
    };
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

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };
  

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
  
  const handleRegister = async (e) => {
    e.preventDefault();
  
    if (!firstName || !lastName || !email || !password || !dob || !gender) {
      setError('Todos los campos son obligatorios.');
      setTimeout(() => setError(''), 3000);
      return;
    }
  
    if (calcularEdad(dob) < 18) {
      setError('Debes tener al menos 18 años para registrarte.');
      setTimeout(() => setError(''), 3000);
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const ip = await obtenerIP(); // Obtener IP antes de guardar en Firebase
  
      const userData = {
        firstName,
        lastName,
        email,
        dob,
        gender,
        rol: "cliente",
      };
  
      await set(ref(database, 'Usuarios/' + user.uid), userData);
  
      // 🔹 Guardar sesión en Firebase en la tabla 'sesiones'
      const sessionData = {
        email: user.email,
        username: firstName,
        inicioSesion: obtenerFechaHora(),
        ip: ip, // Ahora almacena la IP real
      };
      await set(ref(database, 'sesiones/' + user.uid), sessionData);
  
      setSuccessMessage('Cuenta registrada exitosamente');
      setTimeout(() => navigate('/'), 2000);
  
    } catch (err) {
      setError('Error al registrar la cuenta. Verifique los datos ingresados.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGoogleRegister = async () => {
    const provider = new GoogleAuthProvider();
  
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Verifica si ya existe en la base de datos
      const userRef = ref(database, 'Usuarios/' + user.uid);
      const userData = {
        firstName: user.displayName.split(" ")[0],
        lastName: user.displayName.split(" ").slice(1).join(" "),
        email: user.email,
        dob: "", // No disponible con Google
        gender: "", // No disponible con Google
        rol: "cliente",
      };
  
      await set(userRef, userData);
  
      const sessionData = {
        email: user.email,
        username: user.displayName,
        inicioSesion: obtenerFechaHora(),
        ip: await obtenerIP(),
      };
  
      await set(ref(database, 'sesiones/' + user.uid), sessionData);
  
      setSuccessMessage('Sesión iniciada con Google.');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Error con Google:', error);
      setError('No se pudo completar el acceso con Google.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  
  

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (

    

    <div className="registro-container">
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Nombres:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label>Apellidos:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <label>Correo electrónico:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="password-container">
          <label>Contraseña:</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={togglePasswordVisibility} className="password-eye">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div>
          <label>Fecha de nacimiento:</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <label>Sexo:</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Selecciona</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        {error && <p className="error-message">{error}</p>}
{successMessage && <p className="success-message">{successMessage}</p>}
<button type="submit">Registrar</button>

<div className="registro-google-container">
  <button
    className="registro-btn-google"
    type="button" 
    onClick={handleGoogleRegister}
  >
    <FaGoogle className="registro-icon" />
    Inicio rápido con Google
  </button>
</div>




      </form>

      <div className="login-link">
        <p>¿Tiene cuenta? <a href="/login">Inicie sesión ➜</a></p>
      </div>
    </div>
  );
};

export default Register;



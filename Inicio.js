import React, { useState, useEffect, useRef } from "react";
import { getDatabase, set, ref, onValue, get, remove, push   } from "firebase/database";
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, database } from "./firebase.js";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrash, faQrcode, faShoppingCart, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/inicio.css";
import "animate.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';


// Componentes individuales para cada sección
const InicioContent = ({ setContenido }) => {
  const [username, setUsername] = useState("");
  const [animationKey, setAnimationKey] = useState(0);


  useEffect(() => {
    // Obtener el username de localStorage al cargar la página
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);
  
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey((prevKey) => prevKey + 1);
    }, 5000); // Se reinicia cada 5 segundos (ajusta según el tiempo del carrusel)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="contenido">
      {/* Carrusel */}
      <div id="carouselExample" className="carousel slide mt-0 carruselini" data-bs-ride="carousel">
        {/* Indicadores */}
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#carouselExample" data-bs-slide-to="0" className="active"></button>
          <button type="button" data-bs-target="#carouselExample" data-bs-slide-to="1"></button>
          <button type="button" data-bs-target="#carouselExample" data-bs-slide-to="2"></button>
        </div>

        <div className="carousel-inner">
          {["/images/fondomadera1.webp", "/images/fondomadera4.jpg", "/images/fondomadera3.jpg"].map((image, index) => (
            <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
              <img src={image} className="d-block w-100" alt={`Slide ${index + 1}`} />
              <div className="carousel-caption d-flex flex-column align-items-center">
                <p
                  className={`carousel-text animate__animated animate__fadeInDown`}
                  key={animationKey}
                >
                  Bienvenido a la tienda, encontrarás buenos productos
                </p>
                <a
                  className={`btn btn-primary botonentrar animate__animated animate__fadeInUp`}
                  key={animationKey + 1}
                  onClick={() => setContenido("productos")}
                >
                  Ver Productos
                </a>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExample" data-bs-slide="prev">
          <span className="carousel-control-prev-icon botonatras"></span>
        </button>
        <button className="carousel-control-next botondelante" type="button" data-bs-target="#carouselExample" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>

      {/* Sección de contenido con fondo negro */}
      <div className="info-container">
      <div className="info-text">
      <h2 style={{ marginBottom: "30px", textAlign: "center", textAlign: "center", color: "#ffcc00" }} className="title">RyG Corporation Maderera</h2>
      <p style={{ marginBottom: "30px", textAlign: "center" }}>
        Somos una empresa especializada en la fabricación y distribución del sector madera para uso interno, 
        almacenaje y exportación. Nuestra experiencia en el sector Maderero y del embalaje, sumado a nuestro 
        personal altamente calificado, responde a la demanda de calidad que exigen nuestros clientes.  
        Prueba de ello son nuestros clientes que durante estos años han depositado su confianza en nosotros, 
        convirtiéndonos en una de las empresas de referencia en el sector maderero.
      </p>
    </div>

        <div className="info-video">
          <iframe
            width="510"
            height="400"
            src="https://www.youtube.com/embed/wZv2FAM0_sw?start=5"
            title="YouTube Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Sección Nuestros Clientes */}
      <div className="clientes-container">
        <h2 className="clientes-title">Nuestros Clientes</h2>
        <div className="clientes-logos">
          <img src="/images/paraiso.png" alt="Paraiso" />
          <img src="/images/efe.jpg" alt="EFC" />
          <img src="/images/trucksmotors.jpg" alt="Truck Motors" />
          <img src="/images/ed.jpg" alt="ED&F Man" />
        </div>
      </div>
    </div>
  );
};


const ProductosContent = ({ actualizarCarrito }) => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [orden, setOrden] = useState("nombre-asc");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [user] = useAuthState(auth);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  const categorias = [
    "Mobiliario", "Construcción y Carpintería", "Maderas y Tableros", "Mobiliario para Mascotas"
  ];

  useEffect(() => {
    const productosRef = ref(database, "productos");
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProductos(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      }
    });
  }, []);

  const ordenarProductos = (productos) => {
    return [...productos].sort((a, b) => {
      if (orden.includes("nombre")) {
        return orden === "nombre-asc" ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
      }
      return orden === "precio-asc" ? a.precio - b.precio : b.precio - a.precio;
    });
  };

  const handleComprar = (producto) => {
    if (user) {
      navigate("/productopago", { state: { producto: { ...producto, cantidad: 1 } } });
    } else {
      navigate("/login");
    }
  };

  const handleOpenModal = (producto) => {
    setProductoSeleccionado(producto);
    setMostrarModal(true);
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    setProductoSeleccionado(null);
  };

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) &&
    (categoriaSeleccionada ? p.categoria === categoriaSeleccionada : true)
  );

  return (
    <div className="container p-4">
      <h2 className="text-xl font-bold text-center mb-4 fade-in">Productos</h2>

      <div className="row justify-content-center mb-4 fade-in">
        <div className="col-12 col-md-4 mb-2">
          <input
            placeholder="Buscar productos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="form-control w-100"
          />
        </div>
        <div className="col-12 col-md-4">
          <select value={orden} onChange={(e) => setOrden(e.target.value)} className="form-select w-100">
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
            <option value="precio-asc">Precio (Menor a Mayor)</option>
            <option value="precio-desc">Precio (Mayor a Menor)</option>
          </select>
        </div>
        <div className="col-12 col-md-4">
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="form-select w-100 categoriasdes"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-3 g-4">
        {ordenarProductos(productosFiltrados).map((producto) => (
          <div key={producto.id} className="col producto-card" onClick={() => handleOpenModal(producto)} style={{ cursor: "pointer"}}>
            <div className="card h-100 shadow-sm cartagod" style={{ borderRadius: "25px", overflow: "hidden" }}>
              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="card-img-top img-fluid"
                style={{ height: "180px", objectFit: "cover" }}
              />
              <div className="card-body d-flex flex-column text-center">
                <h5 className="card-title" style={{ color: "black", fontWeight: "bold", fontSize: "24px" }}>
                  {producto.nombre}
                </h5>
                <p style={{ color: "black" }}>
                  <strong>Precio/unidad:</strong> S/ {producto.precio}
                </p>

                <p>
                  <strong>Stock:</strong>{" "}
                  {producto.cantidad > 0 ? (
                    producto.cantidad
                  ) : (
                    <span className="text-danger fw-bold">Agotado</span>
                  )}
                </p>

                <div className="mt-auto">
                  <div className="d-flex justify-content-center gap-2 mb-2">
                  <button
                  className="btn btn-success btn-sm boton-animadouno"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComprar(producto);
                  }}
                  disabled={producto.cantidad === 0}
                >
                  <i className="bi bi-credit-card"></i> Comprar
                </button>

                <button
                  className="btn btn-warning btn-sm boton-animadodos"
                  onClick={(e) => {
                    e.stopPropagation();
                    actualizarCarrito(producto);
                  }}
                  disabled={producto.cantidad === 0}
                >
                  <i className="bi bi-cart-plus"></i> Agregar al Carrito
                </button>

                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && productoSeleccionado && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              {/* Barra superior con fondo oscuro y el botón de cerrar */}
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">{productoSeleccionado.nombre}</h5>
                <button
                  type="button"
                  className="btn-close text-white"
                  aria-label="Close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              
              <div className="modal-body p-4">
                <div className="row g-4 align-items-center">
                  <div className="col-md-6">
                    <img
                      src={productoSeleccionado.imagen}
                      alt={productoSeleccionado.nombre}
                      className="img-fluid rounded"
                      style={{ maxHeight: "400px", objectFit: "cover" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <p><strong>Descripción:</strong> {productoSeleccionado.descripcion}</p>
                    <p><strong>Categoría:</strong> {productoSeleccionado.categoria}</p>
                    <p><strong>Precio/unidad:</strong> S/ {productoSeleccionado.precio}</p>
                    <p><strong>Stock:</strong>{" "}
                      {productoSeleccionado.cantidad > 0 ? (
                        productoSeleccionado.cantidad
                      ) : (
                        <span className="text-danger fw-bold">Agotado</span>
                      )}
                    </p>

                    {/* Contenedor de botones centrados */}
                    <div className="d-flex gap-2 mt-3 justify-content-center">
                      <button
                        className="btn btn-success boton-animadouno"
                        onClick={() => handleComprar(productoSeleccionado)}
                        disabled={productoSeleccionado.cantidad === 0}
                      >
                        <i className="bi bi-credit-card"></i> Comprar
                      </button>
                      <button
                        className="btn btn-warning boton-animadodos"
                        onClick={() => actualizarCarrito(productoSeleccionado)}
                        disabled={productoSeleccionado.cantidad === 0}
                      >
                        <i className="bi bi-cart-plus"></i> Agregar al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};


const ServiciosContent = () => {
  const [servicios, setServicios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [orden, setOrden] = useState("nombre-asc");
  const [vista, setVista] = useState("servicios");


    // Obtener los servicios y ordenarlos

  useEffect(() => {
    const serviciosRef = ref(database, "servicios");
    onValue(serviciosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setServicios(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      }
    });
  }, []);


  // Ordena los servicios
  const ordenarServicios = (servicios) => {
    return [...servicios].sort((a, b) => {
      if (orden.includes("nombre")) {
        return orden === "nombre-asc" ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
      }
      return orden === "precio-asc" ? a.precio - b.precio : b.precio - a.precio;
    });
  };

  const handleWhatsApp = (servicio) => {
    const numeroWhatsApp = "51917534610"; // Reemplaza con el número de WhatsApp deseado
    const mensaje = `Hola, estoy interesado en el servicio '${servicio.nombre}'. ¿Podrías darme más información?`;
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="container p-4 d-flex flex-column align-items-center">
      {/* Título de la sección */}
      <h2 className="text-xl font-bold text-center mb-4 fade-in">Servicios</h2>
  
      {/* Barra de búsqueda y ordenamiento */}
      <div className="row justify-content-center mb-4 fade-in w-100">
        <div className="col-12 col-md-4 mb-2">
          <input
            placeholder="Buscar Servicios..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="form-control w-100"
          />
        </div>
        <div className="col-12 col-md-4">
          <select value={orden} onChange={(e) => setOrden(e.target.value)} className="form-select w-100">
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
          </select>
        </div>
      </div>
  
      {/* Contenedor principal de los servicios */}
      <div className="d-flex flex-wrap justify-content-center" id="servicios-container">
        {ordenarServicios(servicios.filter((s) => s.nombre.toLowerCase().includes(filtro.toLowerCase()))).map((servicio) => (
          <div 
            className="servicio-card d-flex text-black rounded shadow-lg mb-4 border"
            key={servicio.id}
          >
            {/* 📌 Sección de Imagen */}
            <div className="servicio-imagen">
              <img
                src={servicio.imagen}
                alt={servicio.nombre}
              />
            </div>
  
            {/* 📌 Línea divisoria */}
            <div className="servicio-linea"></div>
  
            {/* 📌 Sección de Información */}
            <div className="servicio-info">
              <h3 className="fw-bold">{servicio.nombre}</h3>
              <p>{servicio.descripcion}</p>
              <button className="boton-animadoz" onClick={() => handleWhatsApp(servicio)}>
              <i class="bi bi-cart-check-fill text-primary me-2"></i>  Adquirir Servicio
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  
  
  
};




const NosotrosContent = () => {
  return (
    <section className="nosotros">
      {/* Banner */}
      <div className="nosotros-banner">
        <h2>RyG Corporation Maderera</h2>
        <h5>
            Somos una empresa con más de 10 años de experiencia dedicados a la venta y procesamiento de madera de calidad de las distintas especies existentes en el Perú.
        </h5>
      </div>

      {/* Contenido Principal */}
      <div className="container mt-4 nosotrospri">
        <div className="nosotros letra">
          <p>
          Nuestra experiencia en el sector Maderero sumado a nuestro personal altamente calificado permite que podamos tener clientes satisfechos con el servicio brindado.
          </p>
          <p>
          Abastecemos a los sectores de la construcción y minería, tanto en el sector interno del Perú como también para exportación. 
          </p>
        </div>

        {/* Visión y Misión */}
        <div className="row mt-4 nosotrosvi">
          <div className="col-md-6">
            <div className="vision">
              <h3 className="fw-bold text-center">VISIÓN</h3>
              <p>
                Ser reconocida en el Perú y en el mundo como una empresa líder en el sector maderero, referente de calidad y buena atención para nuestros clientes.  
                Nos comprometemos a innovar constantemente en nuestros procesos, adoptando tecnologías sostenibles y responsables con el medio ambiente.  
                Aspiramos a fortalecer nuestra presencia en el mercado con productos que cumplan con los más altos estándares, generando confianza y fidelidad en cada uno de nuestros clientes.  
              </p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mision">
              <h3 className="fw-bold text-center">MISIÓN</h3>
              <p>
                Buscamos satisfacer la demanda integral de productos del sector maderero, dotados con maquinaria de última generación, con colaboradores altamente calificados, garantizando la entrega oportuna y de calidad con precios muy competitivos.  
                Nuestro compromiso es ofrecer soluciones innovadoras y sostenibles, priorizando la excelencia operativa y el desarrollo continuo de nuestro equipo humano.  
                Promovemos relaciones comerciales basadas en la transparencia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};




const ClienteContent = () => {
  return (

    <section className="clientes">
    {/* Banner */}
    <div className="clientes-banner">
      <h2>LO MEJOR PARA LOS CLIENTES</h2>
      <h5>
      Constantemente buscamos mejorar la relación con nuestros clientes para una mejor atención, trabajando en equipo fijamos objetivos y un plan de acción en conjunto con nuestros colaboradores, para lograr enfrentar constantes procesos de cambio y aprovecharlos como una oportunidad de mejor servicio, para el mejoramiento continuo.
      </h5>
    </div>

    <div className="clientes-container">
      <h2 className="titlesecliente">Todos Nuestros Clientes</h2>
      <div className="clientes-logos">
        <img src="/images/paraiso.png" alt="Paraiso" />
        <img src="/images/efe.jpg" alt="EFC" />
        <img src="/images/trucksmotors.jpg" alt="Truck Motors" />
        <img src="/images/ed.jpg" alt="ED&F Man" />
        <img src="/images/hlc.jpeg" alt="Paraiso" />
        <img src="/images/textilchavin.jpeg" alt="EFC" />
        <img src="/images/coinrefri.jpeg" alt="Truck Motors" />
        <img src="/images/marsa.jpeg" alt="ED&F Man" />
        <img src="/images/cruzdelzur.jpeg" alt="ED&F Man" />
      </div>
    </div>
    </section>
  );
};






const ContactoContent = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    celular: "",
    email: "",
    asunto: "",
    mensaje: "",
  });

  // Tiempo de restricción en milisegundos (por defecto, 1 día)
  const [timeLimit, setTimeLimit] = useState(24 * 60 * 60 * 1000); // 1 día

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.celular || !formData.email || !formData.asunto || !formData.mensaje) {
      alert("Por favor, complete todos los campos antes de enviar.");
      return;
    }

    // Obtener la última fecha de envío del localStorage
    const lastSent = localStorage.getItem("lastMessageSent");
    const now = Date.now();

    if (lastSent && now - lastSent < timeLimit) {
      alert("Ya ha enviado un mensaje recientemente. Inténtelo más tarde.");
      return;
    }

    // Registrar el nuevo envío
    localStorage.setItem("lastMessageSent", now);

    // Enviar correo
    const mailtoLink = `mailto:ventas@rygcorporationmaderera.com?subject=${encodeURIComponent(
      formData.asunto
    )}&body=${encodeURIComponent(
      `Nombre: ${formData.nombre}\nCelular: ${formData.celular}\nEmail: ${formData.email}\nMensaje: ${formData.mensaje}`
    )}`;

    window.location.href = mailtoLink;

    alert("Mensaje enviado correctamente.");
  };

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-md-7">
          <h4 className="fw-bold">Formulario de contacto</h4>
          <h4 className="fw-bold" style={{ fontSize: "20px", marginBottom: "46px" }}>
            ¡Rellene con su información y envíe el mensaje que desee!
          </h4>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <input type="text" name="nombre" className="form-control" placeholder="Nombre Completo" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <input type="text" name="celular" className="form-control" placeholder="Celular" value={formData.celular} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <input type="email" name="email" className="form-control" placeholder="Email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <input type="text" name="asunto" className="form-control" placeholder="Asunto" value={formData.asunto} onChange={handleChange} required />
              </div>
              <div className="col-12">
                <textarea name="mensaje" className="form-control" rows="4" placeholder="Escriba su mensaje" value={formData.mensaje} onChange={handleChange} required></textarea>
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-enviar">Enviar <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EFEFEF"><path d="m600-200-56-57 143-143H300q-75 0-127.5-52.5T120-580q0-75 52.5-127.5T300-760h20v80h-20q-42 0-71 29t-29 71q0 42 29 71t71 29h387L544-624l56-56 240 240-240 240Z"/></svg></button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-md-5">
          <h4 className="fw-bold">Información General</h4>
          <ul className="list-unstyled">
            <li>
              <i className="bi bi-telephone text-success me-2"></i>
              926 716 421
            </li>
            <li>
              <i className="bi bi-envelope text-success me-2"></i>
              <a href="mailto:ventas@rygcorporationmaderera.com" className="text-dark text-decoration-none">
                ventas@rygcorporationmaderera.com
              </a>
            </li>
            <li>
              <i className="bi bi-geo-alt text-success me-2"></i>
              C.C Km 15.5 Lt 19 Asociación de propietarios Parque Industrial Pariachi Lima - Ate
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="fw-bold">¡Puede encontrarnos en..!</h4>
        <iframe
          title="Mapa de ubicación"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.5265804071355!2d-76.8471995!3d-12.0054751!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c394184df7a3%3A0x392deeba67356d15!2sInversiones%20Callupe%20S.A.C.!5e0!3m2!1ses!2spe!4v1697034569827!5m2!1ses!2spe"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
};









const Inicio = () => {
  document.body.className = "body-inicio";
  const [contenido, setContenido] = useState("inicio");
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [userName, setUserName] = useState(null);
  const [user] = useAuthState(auth);
  const [userID, setUserID] = useState(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const db = getDatabase();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef(null);

  const dropdownRef = useRef(null); // Referencia al menú desplegable

  const [isOpen, setIsOpen] = useState(false); // Estado del menú

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
    console.log("Botón de navegación clickeado");
    console.log("Estado actual del menú:", isOpen ? "Cerrado" : "Abierto");
  };

  const closeMenu = () => {
    setIsOpen(false);
  };
  
  


  // Cierra el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  


  useEffect(() => {
    let styles = {};
  
    if (contenido === "productos") {
      styles = {
        background: "linear-gradient(135deg,rgb(210, 226, 229),rgb(255, 255, 255),rgb(209, 230, 231))", // Degradado
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else if (contenido === "servicios") {
      styles = {
        background: "linear-gradient(135deg,rgb(210, 226, 229),rgb(255, 255, 255),rgb(209, 230, 231))", // Degradado
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else {
      styles = {
        backgroundColor: "", // Restaura a su estado original
        backgroundImage: "",
      };
    }
  
    Object.assign(document.body.style, styles);
  }, [contenido]);
  

  const modal = document.getElementById("carritoModal");

  const handleComprar = () => {


    if (modal) {
      console.log("✅ Modal encontrado. Intentando cerrarlo...");
      const closeButton = modal.querySelector(".btn-close");
      if (closeButton) {
        console.log("✅ Botón de cierre encontrado. Cerrando modal...");
        closeButton.click();
      } else {
        console.warn("⚠️ Botón de cierre no encontrado.");
      }
    } else {
      console.warn("⚠️ Modal no encontrado en el DOM.");
    }

    if (!userName) {
      navigate("/Login"); // Redirigir al login si no está autenticado
    } else {
      navigate("/productocompra", { state: { carrito } }); // Enviar carrito a productocompra
    }
    
  };

  const cargarUsuarioDesdeDB = async (uid, setUserName, setUserRole) => {
    try {
      const usuarioRef = ref(db, `Usuarios/${uid}`); // Ruta en Realtime DB
      const snapshot = await get(usuarioRef);
  
      if (snapshot.exists()) {
        const datosUsuario = snapshot.val();
        setUserName(datosUsuario.firstName); // 🔹 Usa "firstName"
        setUserRole(datosUsuario.rol || "Cliente"); // 🔹 Almacena el rol, por defecto "Cliente"
      } else {
        console.log("No se encontró el usuario en la base de datos.");
        setUserName("Usuario");
        setUserRole("Cliente"); // Si no existe, asigna rol "Cliente"
      }
    } catch (error) {
      console.error("Error obteniendo el usuario:", error);
      setUserName("Usuario");
      setUserRole("Cliente");
    }
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserID(user.uid);
        cargarUsuarioDesdeDB(user.uid, setUserName, setUserRole);
        cargarCarrito(user.uid);
      } else {
        setUserName(null);
        setUserID(null);
        setUserRole("Cliente"); // Asignar rol "Cliente" si no hay sesión
        setCarrito([]);
      }
    });
  
    return () => unsubscribe();
  }, []);
  
  

  useEffect(() => {
    const nuevoTotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    setTotal(nuevoTotal);
    if (userID) {
      guardarCarrito(userID, carrito);
    }
  }, [carrito]);

  const guardarCarrito = (uid, carrito) => {
    set(ref(db, `carritos/${uid}`), carrito);
  };

  const cargarCarrito = async (uid) => {
    const carritoRef = ref(db, `carritos/${uid}`);
    const snapshot = await get(carritoRef);
    if (snapshot.exists()) {
      setCarrito(snapshot.val());
    }
  };

  const actualizarCarrito = (producto) => {
    setCarrito((prevCarrito) => {
      const existe = prevCarrito.find((item) => item.id === producto.id);
      if (existe) {
        return prevCarrito.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prevCarrito, { ...producto, cantidad: 1 }];
      }
    });
  };

  const eliminarProducto = (id) => {
    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.id !== id));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const agregarUnoMas = (id) => {
    setCarrito((prevCarrito) =>
      prevCarrito.map((item) =>
        item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    );
  };

  const quitarUno = (id) => {
    setCarrito((prevCarrito) =>
      prevCarrito
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const handleLogout = async () => {
    try {
      // Referencia a la tabla de sesiones en Firebase
      const sesionesRef = ref(database, "sesiones");
  
      // Obtener todas las sesiones
      const snapshot = await get(sesionesRef);
  
      if (snapshot.exists()) {
        let sessionIdToDelete = null;
  
        // Buscar la sesión actual basada en el usuario autenticado
        snapshot.forEach((childSnapshot) => {
          const sessionData = childSnapshot.val();
          if (sessionData.email === auth.currentUser?.email) {
            sessionIdToDelete = childSnapshot.key; // Obtener el ID de sesión
          }
        });
  
        // Si se encontró la sesión, eliminarla
        if (sessionIdToDelete) {
          await remove(ref(database, `sesiones/${sessionIdToDelete}`));
          console.log("Sesión eliminada correctamente.");
        } else {
          console.warn("No se encontró sesión activa en Firebase.");
        }
      }
  
      // Cerrar sesión en Firebase Authentication
      await signOut(auth);
      console.log("Usuario deslogueado exitosamente.");
  
      // Resetear estados en React
      setUserName(null);
      setMenuVisible(false);
      setCarrito([]);
  
      // Redirigir al usuario a la página de inicio
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };
  

  




return (
  <div className="w-100 text-center">
    {/* Navbar */}
    <header className="navbar navbar-light bg-light p-0">
  <div className="container-fluid d-flex justify-content-between align-items-center py-2 flex-wrap">
    {/* Logo */}
    <a className="navbar-brand logoinfo" href="/">
      <img src="/images/logomadera.jpg" alt="Logo" style={{ height: "80px", width: "160px" }} />
    </a>

    {/* Información de contacto */}
    <div className="d-flex align-items-center gap-3 contact-info">
      <div className="d-flex align-items-center">
        <i className="bi bi-telephone me-2 text-white"></i>
        <span style={{ color: "white" }}>920166931</span>

      </div>
      <div className="d-flex align-items-center letraventas">
        <i className="bi bi-envelope me-2 text-white iconocorreo"></i>
        <a href="mailto:ventas@rygcorporationmaderera.com" className="text-decoration-none text-white">
          ventas@rygcorporationmaderera.com
        </a>
      </div>
    </div>
    

    {/* Botón de inicio de sesión y carrito */}
    <div className="d-flex align-items-center gap-3 user-actions iniciasesion">
    {userName ? (
    <div className="dropdown text-center" ref={dropdownRef}>
      <button id="btn-login" className="btn btn-primary botoninicio" onClick={() => setMenuVisible(!menuVisible)}>
        <i className="bi bi-person-circle me-1"style={{ paddingLeft: "6px" }} ></i>  
        <div className="d-flex flex-column align-items-center">
          <span className="fw-bold" >Hola, {userName} <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFF"><path d="M480-345 240-585l56-56 184 183 184-183 56 56-240 240Z"/></svg></span>
        </div>
      </button>
      {menuVisible && (
          <ul className="dropdown-menu show" style={{ marginTop: "4px" }}>
{/* <li><a className="dropdown-item" href="/perfil"> <i className="bi bi-person"></i> Mi Perfil</a></li> */}

            <li><a className="dropdown-item" href="/mis-pedidos"> <i className="bi bi-bag"></i> Mis Pedidos</a></li>

            {userRole?.toLowerCase() !== "cliente" && (
          <li>
            <a className="dropdown-item" href="/panel">
              <i className="bi bi-bar-chart"></i> Panel
            </a>
          </li>
        )}


          <li><hr className="dropdown-divider" /></li>
          <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
              </button>
            </li>
        </ul>
          )}
        </div>
      ) : (
        <a href="/Login" id="btn-login" className="btn btn-primary">
          <i className="bi bi-person-circle me-1"></i> Iniciar Sesión
        </a>
      )}

      {/* Botón del carrito */}
      <button className="btn btn-warning position-relative carritoini" data-bs-toggle="modal" data-bs-target="#carritoModal">
        <i className="bi bi-cart"></i>
        {carrito.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {carrito.length}
          </span>
        )}
      </button>
    </div>
  </div>
</header>


    {/* Modal del carrito */}
    <div className="modal fade" id="carritoModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Carrito de Compras</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            {carrito.length > 0 ? (
              <ul>
                {carrito.map((item) => (
                  <li key={item.id} className="d-flex align-items-center justify-content-between">
                    {item.nombre} - S/ {item.precio} (x{item.cantidad})
                    <div className="d-flex gap-2">
                    <button
                    className="btnIncrease"
                    onClick={() => agregarUnoMas(item.id)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                  <button
                    className="btnDecrease"
                    onClick={() => quitarUno(item.id)}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <button
                    className="btnDelete"
                    onClick={() => eliminarProducto(item.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Tu carrito está vacío.</p>
            )}
            <h5 className="mt-3">Total: S/. {total.toFixed(2)}</h5>
          </div>
            {/* Botón de compra en el modal del carrito */}
            <div className="modal-footer">
              {carrito.length > 0 && (
                <>
                  <button className="btn btn-warning" style={{ borderRadius: "80px", fontWeight: "bold" }} onClick={vaciarCarrito}><i className="bi bi-cart-x-fill"></i>  Vaciar Carrito</button>
                  <button className="btn btn-success btn-sm " style={{ borderRadius: "80px", fontWeight:"bold" }} onClick={() => handleComprar(carrito)}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EFEFEF"><path d="M200-80q-33 0-56.5-23.5T120-160v-480q0-33 23.5-56.5T200-720h80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720h80q33 0 56.5 23.5T840-640v480q0 33-23.5 56.5T760-80H200Zm0-80h560v-480H200v480Zm280-240q83 0 141.5-58.5T680-600h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85h-80q0 83 58.5 141.5T480-400ZM360-720h240q0-50-35-85t-85-35q-50 0-85 35t-35 85ZM200-160v-480 480Z"/></svg> Comprar</button>
                </>
              )}
              <button type="button" style={{ borderRadius: "80px", fontWeight: "bold" }}  className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
      </div>
    </div>

    {/* Menú de navegación */}
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container-fluid">
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu} // Manejo manual del menú
          style={{ color: "black" }}
        >
          ☰
        </button>
        <span className="navbar-title">Menú</span>
        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="menuNav">
          <ul className="navbar-nav mx-auto text-center lista-da">
            <li className={`nav-item namebarra ${contenido === "inicio" ? "active" : ""}`}>
              <a className="nav-link" onClick={() => { setContenido("inicio"); closeMenu(); }}>
                INICIO
              </a>
            </li>
            <li className={`nav-item namebarra ${contenido === "productos" ? "active" : ""}`}>
              <a className="nav-link" onClick={() => { setContenido("productos"); closeMenu(); }}>
                PRODUCTOS
              </a>
            </li>
            <li className={`nav-item namebarra ${contenido === "servicios" ? "active" : ""}`}>
              <a className="nav-link" onClick={() => { setContenido("servicios"); closeMenu(); }}>
                SERVICIOS
              </a>
            </li>
            <li className={`nav-item namebarra ${contenido === "nosotros" ? "active" : ""}`}>
              <a className="nav-link" onClick={() => { setContenido("nosotros"); closeMenu(); }}>
                NOSOTROS
              </a>
            </li>
            <li className={`nav-item namebarra ${contenido === "clientes" ? "active" : ""}`}>
              <a className="nav-link" onClick={() => { setContenido("clientes"); closeMenu(); }}>
                CLIENTES
              </a>
            </li>
            <li className={`nav-item namebarra ${contenido === "contacto" ? "active" : ""}`}>
              <a className="nav-link" onClick={() => { setContenido("contacto"); closeMenu(); }}>
                CONTACTOS
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

      {/* Contenido dinámico */}
      <div className="containergene">
      {contenido === "inicio" && <InicioContent setContenido={setContenido} />}
        {contenido === "productos" && <ProductosContent actualizarCarrito={actualizarCarrito} />}
        {contenido === "servicios" && <ServiciosContent />}
        {contenido === "contacto" && <ContactoContent />}
        {contenido === "nosotros" && <NosotrosContent />}
        {contenido === "clientes" && <ClienteContent />}
      </div>

        {/* Footer */}
        <footer className="footer">
        <div className="container-footer">
          <div className="footer-row">
            <div className="links">
              <h4>Compañía</h4>
              <ul>
                <li><a onClick={() => setContenido("nosotros")}>Nosotros</a></li>
                <li><a onClick={() => setContenido("servicios")}>Nuestros servicios</a></li>
                <li><a href="">Privacidad</a></li>
              </ul>
            </div>
            <div className="links">
              <h4>Ayuda</h4>
              <ul>
                <li><a onClick={() => setContenido("contacto")}>Contáctanos</a></li>
              </ul>
            </div>
            <div className="links">
              <h4>Tienda</h4>
              <ul>
                <li><a href="">Próximamente...</a></li>
              </ul>
            </div>
            <div className="links">
              <h4>Síguenos</h4>
              <div className="social-link">
                <a href="https://www.facebook.com/profile.php?id=100064875226184"><i className="fab fa-facebook-f"></i></a>
                <a href="https://www.instagram.com"><i className="fab fa-instagram"></i></a>
                <a href="https://www.twitter.com"><i className="fab fa-twitter"></i></a>
                <a href="https://www.linkedin.com"><i className="fab fa-linkedin"></i></a>
                <a href="https://wa.me/51917534610" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp"></i>
                </a>
                <p>&copy; RyGcorporationmaderera</p>
              </div>

            </div>
          </div>
        </div>
        </footer>

        <div className="support-button" onClick={() => window.open("https://wa.me/51917534610?text=Hola,%20necesito%20ayuda%20con%20mi%20compra.", "_blank")}>
          <i className="fas fa-headset"></i> Soporte
        </div>
        
        </div>
        );
    }; 



export default Inicio;
import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, set, remove } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../src/firebase";
import styles from "../src/css/pedidos.module.css";

const MisPedidos = () => {
  const [user] = useAuthState(auth);
  const [pedidos, setPedidos] = useState([]);

  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
const [ordenFecha, setOrdenFecha] = useState("desc");
const [fechaFiltro, setFechaFiltro] = useState("");


  const [pedidosSeleccionados, setPedidosSeleccionados] = useState([]);

  function parseFechaHora(fechaHoraStr) {
    // Separar fecha y hora
    const [fecha, hora] = fechaHoraStr.split(", ");
    const [dia, mes, año] = fecha.split("/").map(Number);
    return new Date(año, mes - 1, dia, ...hora.split(":").map(Number));
  }

  function esMismaFecha(fechaCompletaStr, fechaFiltroStr) {
    const [diaPedido, mesPedido, añoPedido] = fechaCompletaStr.split(",")[0].split("/").map(Number);
    const [añoFiltro, mesFiltro, diaFiltro] = fechaFiltroStr.split("-").map(Number); // "yyyy-mm-dd" formato del input
    
    return (
      diaPedido === diaFiltro &&
      mesPedido === mesFiltro &&
      añoPedido === añoFiltro
    );
  }
  
  

  useEffect(() => {
    if (!user) {
      setPedidos([]); // Si no hay usuario, limpiar pedidos
      return;
    }

    console.log("🔄 Cargando pedidos para el usuario:", user.uid);

    const db = getDatabase();
    const pedidosRef = ref(db, "pedidos"); // Referencia a la colección de pedidos

    get(pedidosRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const pedidosData = snapshot.val();
          console.log("✅ Pedidos en Firebase:", pedidosData);

          // 🔹 Convertimos los pedidos a un array y filtramos los del usuario autenticado
          const pedidosArray = Object.entries(pedidosData)
            .map(([id, pedido]) => ({ id, ...pedido }))
            .filter((pedido) => pedido.userID === user.uid); // Filtrar por userID

          setPedidos(pedidosArray); // Guardar los pedidos filtrados en el estado
        } else {
          console.log("⚠ No hay pedidos en la base de datos");
          setPedidos([]);
        }
      })
      .catch((error) => {
        console.error("❌ Error al obtener pedidos:", error);
        setPedidos([]);
      });
  }, [user]);

  const borrarPedido = (pedidoId) => {
    const db = getDatabase();
    const pedidoRef = ref(db, `pedidos/${user.uid}/${pedidoId}`);

    remove(pedidoRef).then(() => {
      setPedidos(pedidos.filter((p) => p.id !== pedidoId));
      alert("Pedido eliminado correctamente");
    });
  };

  const agregarAlCarrito = (pedido) => {
    const db = getDatabase();
    const carritoRef = ref(db, `carritos/${user.uid}`);

    get(carritoRef).then((snapshot) => {
      let carrito = snapshot.exists() ? snapshot.val() : [];

      // 🔹 Verificamos si el producto ya está en el carrito
      pedido.productos.forEach((prod) => {
        console.log("🚀 Producto en el pedido:", prod); // Depuración para verificar el producto

        // Si el campo es 'nombrepro' en el pedido, lo cambiamos a 'nombre' para buscarlo en productos
        const productName = prod.nombrepro || prod.nombre;

        const existingProduct = carrito.find((item) => item.nombre === productName);

        if (existingProduct) {
          // Si el producto ya existe en el carrito, aumentamos la cantidad
          existingProduct.cantidad += prod.cantidad;
        } else {
          // Si el producto no existe, lo agregamos al carrito
          carrito.push({ ...prod, nombre: productName }); // Asegúrate de agregar el nombre correctamente
        }
      });

      // 🔹 Guardamos el carrito actualizado en Firebase
      set(carritoRef, carrito).then(() => {
        alert("Productos agregados al carrito!");
      }).catch((error) => {
        console.error("❌ Error al agregar productos al carrito:", error);
      });
    });
  };


  const manejarSeleccion = (pedidoId) => {
    setPedidosSeleccionados((prev) =>
      prev.includes(pedidoId)
        ? prev.filter((id) => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };
  

  const generarMensajeWhatsapp = () => {
    if (pedidosSeleccionados.length === 0) {
      alert("⚠️ Por favor, seleccione al menos un pedido.");
      return;
    }

    const pedidosFiltrados = pedidos.filter((pedido) =>
      pedidosSeleccionados.includes(pedido.id)
    );

    let mensaje = "Deseo recoger estos pedidos:\n";
    pedidosFiltrados.forEach((pedido) => {
      pedido.productos.forEach((prod) => {
        mensaje += `- ${prod.nombrepro || prod.nombre} (${prod.cantidad} x S/. ${prod.precio})\n`;
      });
    });

    mensaje = encodeURIComponent(mensaje);
    const numeroWhatsApp = "935429602";
    const enlaceWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;
    window.open(enlaceWhatsApp, "_blank");
  };

  useEffect(() => {
    if (!user) {
      setPedidos([]);
      return;
    }
  
    const db = getDatabase();
    const pedidosRef = ref(db, "pedidos");
  
    get(pedidosRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const pedidosData = snapshot.val();
  
          let pedidosArray = Object.entries(pedidosData)
            .map(([id, pedido]) => ({ id, ...pedido }))
            .filter((pedido) => pedido.userID === user.uid);
  
          // ✅ Filtrar por estado (pagado o entregado, insensible a mayúsculas)
          if (estadoFiltro.toLowerCase() !== "todos") {
            const filtro = estadoFiltro.toLowerCase();
            pedidosArray = pedidosArray.filter((pedido) =>
              pedido.estado?.toLowerCase() === filtro
            );
          }
  
          // ✅ Filtrar por fecha
          if (fechaFiltro) {
            pedidosArray = pedidosArray.filter((pedido) =>
              esMismaFecha(pedido.fechaPedido, fechaFiltro)
            );
          }
          
  
          // ✅ Ordenar por fecha
          pedidosArray.sort((a, b) => {
            const fechaA = parseFechaHora(a.fechaPedido);
            const fechaB = parseFechaHora(b.fechaPedido);
          
            return ordenFecha === "asc" ? fechaA - fechaB : fechaB - fechaA;
          });
          
  
          setPedidos(pedidosArray);
        } else {
          setPedidos([]);
        }
      })
      .catch((error) => {
        console.error("❌ Error al obtener pedidos:", error);
        setPedidos([]);
      });
  }, [user, estadoFiltro, ordenFecha, fechaFiltro]);
  
  

  return (
    <div className={styles.containerFlex}>

<div className={styles.filtrosContainer}>
  <h3>Filtrar pedidos</h3>
  
  <label>
    Estado:
    <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
      <option value="Todos">Todos</option>
      <option value="Pagado">Pagado</option>
      <option value="Entregado">Entregado</option>
    </select>
  </label>

  <label>
    Orden por fecha:
    <select value={ordenFecha} onChange={(e) => setOrdenFecha(e.target.value)}>
      <option value="desc">Más nuevo primero</option>
      <option value="asc">Más antiguo primero</option>
    </select>
  </label>

  <label>
    Fecha específica:
    <input 
      type="date" 
      value={fechaFiltro} 
      onChange={(e) => setFechaFiltro(e.target.value)} 
    />
  </label>
</div>

<div className={styles.divisorvertical}></div>

      <ul className={styles.listGroup}>
      <h2 style={{ marginTop: "40px" }}>
            HISTORIAL DE PEDIDOS
            <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#5084C1">
                <path d="M230-80q-45.83 0-77.92-32.08Q120-144.17 120-190v-130h120v-560h600v690q0 45.83-32.08 77.92Q775.83-80 730-80H230Zm499.94-66.67q18.39 0 30.89-12.45 12.5-12.46 12.5-30.88v-623.33H306.67V-320h380v130q0 18.42 12.44 30.88 12.44 12.45 30.83 12.45ZM360-626.67v-66.66h360v66.66H360Zm0 120v-66.66h360v66.66H360Zm-130.67 360H620v-106.66H186.67V-190q0 18.42 12.5 30.88 12.5 12.45 30.16 12.45Zm0 0h-42.66H620 229.33Z"/>
            </svg>
        </h2>
        <p style={{ marginTop: "30px", fontSize: "15px", color: "#444", lineHeight: "1.6", padding: "0 10px" }}>
            Aquí puedes ver el <strong>historial de tus pedidos</strong>. Además, puedes 
            <strong> seleccionar los pedidos que deseas recoger</strong> y contactar fácilmente vía WhatsApp para coordinar el día de recojo.
        </p>

        <div className={styles.divisorvertical}></div>
        <div className={styles.divisor}></div>

        {pedidos.length === 0 ? (
          <p className={styles.noPedidos}>Usted no tiene pedidos</p>
        ) : (
          pedidos.map((pedido, index) => (
            <React.Fragment key={index}>
              <li className={styles.listGroupItem}>
                <span 
                  className={`${styles.estado} ${pedido.estado?.toLowerCase() === "pagado" ? styles.pagado : styles[pedido.estado?.toLowerCase()]}`}
                >
                  {pedido.estado} 
                </span>
                <div className={styles.detalles}>
                  <strong>Fecha:</strong> {pedido.fechaPedido || "Fecha no disponible"} <br />
                  <strong>Total:</strong> S/. {(Number(pedido.total) || 0).toFixed(2)}
                </div>
                <strong>Productos:</strong>
                <ul className={styles.productosLista}>
                  {Array.isArray(pedido.productos) ? (
                    pedido.productos.map((prod, idx) => (
                      <li key={idx}>
                        {prod.nombrepro || prod.nombre} - {prod.cantidad} x S/. {prod.precio}
                      </li>
                    ))
                  ) : (
                    <li>No hay productos en este pedido</li>
                  )}
                </ul>
                <div className={styles.botones} style={{ marginTop: "20px" }}>
                <button className={`${styles.btn} ${styles.carrito}`} onClick={() => agregarAlCarrito(pedido)}>
                  Agregar al carrito
                </button>
              </div>
                {/* Mostrar checkbox solo si el pedido está pagado */}
                {pedido.estado?.toLowerCase() === "pagado" && (
                  <div className={styles.botonSeleccion}>
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        onChange={() => manejarSeleccion(pedido.id)} 
                        checked={pedidosSeleccionados.includes(pedido.id)} 
                        className={styles.checkboxInput}
                      />
                      <span className={styles.checkboxTexto}>Seleccionar para recoger</span>
                    </label>
                  </div>
                )}


              </li>
              {index < pedidos.length - 1 && <div className={styles.divisor}></div>}
            </React.Fragment>
          ))
        )}
      </ul>

      {/* Botón flotante para redirigir a WhatsApp con los productos seleccionados */}
      <div className={styles.floatingButtonContainer}>
        <button className={styles.floatingButton} onClick={generarMensajeWhatsapp}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" height="20" viewBox="0 0 24 24" width="20" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.555 4.173 1.602 5.978L0 24l6.29-1.645A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.971 0-3.892-.518-5.584-1.498l-.397-.231-3.76.982 1.007-3.634-.255-.412C2.63 15.468 2 13.76 2 12 2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm5.15-7.434c-.282-.141-1.671-.827-1.93-.922-.258-.095-.447-.141-.636.141s-.73.922-.896 1.111c-.165.188-.33.212-.611.07-.282-.141-1.189-.438-2.266-1.398-.837-.746-1.402-1.669-1.567-1.951-.165-.282-.018-.435.124-.576.127-.127.282-.33.424-.495.141-.165.188-.282.282-.47.095-.188.047-.353-.023-.495-.07-.141-.636-1.53-.871-2.1-.229-.55-.463-.476-.636-.485l-.541-.009c-.188 0-.495.07-.753.353s-.99.97-.99 2.367.99 2.744 1.13 2.936c.141.188 1.949 2.975 4.725 4.171.661.285 1.177.454 1.58.582.663.211 1.266.181 1.74.11.53-.08 1.671-.682 1.906-1.341.236-.659.236-1.224.165-1.341-.07-.118-.258-.188-.541-.329z"/>
          </svg>
          Contactar para recoger
        </button>
      </div>
    </div>
  );
};

export default MisPedidos;



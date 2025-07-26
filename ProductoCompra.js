import { useEffect, useState } from "react";
import { getDatabase, ref, get, set, push } from "firebase/database";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrash, faQrcode, faShoppingCart, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { auth } from "../src/firebase";
import styles from "../src/css/productocompra.module.css"; // Asegúrate de tener los estilos correctos

const Productocompra = () => {
  const [productos, setProductos] = useState([]);
  const [userID, setUserID] = useState(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [apellidoCliente, setApellidoCliente] = useState("");
  const [numeroConfirmacion, setNumeroConfirmacion] = useState("");
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const db = getDatabase();
  const navigate = useNavigate();
  const [fechaPedido, setFechaPedido] = useState(""); // Definir estado para la fecha

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserID(user.uid);
      obtenerDatosUsuario(user.uid);
      obtenerCarritoUsuario(user.uid);
    }
  }, []);


    useEffect(() => {
      document.body.classList.add('body-compra');
      return () => {
        document.body.classList.remove('body-compra');
      };
    }, []);

  // Función para obtener los datos del usuario
  const obtenerDatosUsuario = async (userID) => {
    const usuarioRef = ref(db, `Usuarios/${userID}`);
    try {
      const snapshot = await get(usuarioRef);
      if (snapshot.exists()) {
        const datosUsuario = snapshot.val();
        setNombreCliente(datosUsuario.firstName || "John");
        setApellidoCliente(datosUsuario.lastName || "Doe");
      } else {
        console.error("No se encontró el usuario");
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    }
  };

  // Función para obtener los productos del carrito
  const obtenerCarritoUsuario = async (userID) => {
    const carritoRef = ref(db, `carritos/${userID}`);
    try {
      const snapshot = await get(carritoRef);
      if (snapshot.exists()) {
        const carrito = snapshot.val();
        setProductos(carrito || []);
      } else {
        console.error("No se encontró el carrito para el usuario");
      }
    } catch (error) {
      console.error("Error al obtener el carrito:", error);
    }
  };

  // Función para actualizar el carrito en Firebase
  const actualizarCarrito = async (userID, carrito) => {
    const carritoRef = ref(db, `carritos/${userID}`);
    try {
      await set(carritoRef, carrito);
    } catch (error) {
      console.error("Error al actualizar el carrito:", error);
    }
  };

  // Función para aumentar la cantidad de un producto
  const aumentarCantidad = (id) => {
    const nuevosProductos = productos.map((producto) =>
      producto.id === id
        ? { ...producto, cantidad: producto.cantidad + 1 }
        : producto
    );
    setProductos(nuevosProductos);
    actualizarCarrito(userID, nuevosProductos);
  };

  // Función para disminuir la cantidad de un producto
  const disminuirCantidad = (id) => {
    const nuevosProductos = productos.map((producto) =>
      producto.id === id && producto.cantidad > 1
        ? { ...producto, cantidad: producto.cantidad - 1 }
        : producto
    );
    setProductos(nuevosProductos);
    actualizarCarrito(userID, nuevosProductos);
  };

  // Función para eliminar un producto del carrito
  const eliminarProducto = (id) => {
    const nuevosProductos = productos.filter((producto) => producto.id !== id);
    setProductos(nuevosProductos);
    actualizarCarrito(userID, nuevosProductos);
  };

  // Función para vaciar el carrito
  const vaciarCarrito = () => {
    setProductos([]);
    actualizarCarrito(userID, []);
  };


  const generarNumeroConfirmacion = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  

  const procesarPago = async () => {
    const fechaPedido = new Date().toLocaleString();
    setFechaPedido(fechaPedido); // Guardar la fecha en el estado para mostrar en la factura
  
    const numero = generarNumeroConfirmacion();
    setNumeroConfirmacion(numero);
    setPagoCompletado(true);
    setModalAbierto(true);
  
    const total = productos.reduce((acc, item) => acc + item.precio * item.cantidad, 0).toFixed(2);
  
    const pedidoData = {
      userID: userID, // Incluir el ID del usuario
      nombrecli: nombreCliente, // Cambiado de 'nombre' a 'nombrecli'
      apellidocli: apellidoCliente, // Cambiado de 'apellido' a 'apellidocli'
      fechaPedido, // Guardar la fecha en Firebase
      productos: productos.map((producto) => ({
        id: producto.id,
        nombrepro: producto.nombre, // Cambiado de 'nombre' a 'nombrepro'
        cantidad: producto.cantidad,
        precio: producto.precio,
      })),
      total: total,
      estado: "pagado",
      recogida: "pendiente",
      numeroConfirmacion: numero, // Ahora es solo un dato, no la ID del pedido
    };
  
    try {
      // Generar un ID único para el pedido en Firebase
      const pedidosRef = ref(db, "pedidos");
      const nuevoPedidoRef = push(pedidosRef); // Genera un nuevo ID único
      await set(nuevoPedidoRef, pedidoData);
  
      console.log("Pedido registrado correctamente con ID:", nuevoPedidoRef.key);

      {/*// Vaciar el carrito después de realizar el pedido
      vaciarCarrito(); */}      //ARREGLAR ESTA COSA QUE VACIA EL CARRITO Y NO SALE EL PAGO COMPLETO CON SUS DATOS

    } catch (error) {
      console.error("Error al registrar el pedido:", error);
    }
  };
  
  useEffect(() => {
    if (mostrarQR && !pagoCompletado) {
      const timer = setTimeout(() => {
        procesarPago(); // Llama a la función que simula el pago
      }, 2000); // Espera 2 segundos
  
      return () => clearTimeout(timer); // Limpia el timeout si se desmonta
    }
  }, [mostrarQR]);
  
  // Función para generar la factura en PDF
  const descargarFactura = () => {
    const doc = new jsPDF();
    const total = productos.reduce((acc, item) => acc + item.precio * item.cantidad, 0).toFixed(2);
  
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text("Factura de Compra", 70, 20);
    

    // Dibujar una línea separadora
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 30, 190, 30);
  
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(`Cliente: ${nombreCliente} ${apellidoCliente}`, 20, 40);
    doc.text(`Fecha del Pedido: ${fechaPedido}`, 20, 50);
    doc.text(`Número de Confirmación: ${numeroConfirmacion}`, 20, 60);
  
    // Dibujar una línea separadora
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 70, 190, 70);
  
    // Información de los productos
    let yPosition = 80;
    productos.forEach((item, index) => {
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`Producto ${index + 1}: ${item.nombre}`, 20, yPosition);
      doc.text(`Cantidad: ${item.cantidad}`, 20, yPosition + 10);
      doc.text(`Precio Unitario: S/ ${item.precio}`, 20, yPosition + 20);
      
      // Línea separadora entre productos
      doc.setDrawColor(180, 180, 180);
      doc.line(20, yPosition + 25, 190, yPosition + 25);
  
      yPosition += 35;
    });
  
    // Total
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Pagado: S/ ${total}`, 20, yPosition);
    yPosition += 10;
  
    // Estado del pedido
    doc.setTextColor(200, 0, 0);
    doc.text(`Estado: Pendiente de recogida`, 20, yPosition);
  
    // Guardar la factura como un archivo PDF
    doc.save(`Factura_${numeroConfirmacion}.pdf`);
  };
  


  // Función para eliminar el carrito después de completar el pago
  const eliminarCarritoTrasPago = () => {
    vaciarCarrito();
    setModalAbierto(false);
    navigate("/");
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Resumen de Compra</h2>

      {productos.length > 0 ? (
        <ul className={styles.productList}>
          {productos.map((item) => (
            <li key={item.id} className={styles.productItem}>
              <img
                src={item.imagen}
                alt={item.nombre}
                className={styles.productImage}
              />
              <div className={styles.productInfo}>
                <h4>{item.nombre}</h4>
                <p>Precio: S/ {item.precio}</p>
                <p>Cantidad: {item.cantidad}</p>
                <div className={styles.buttonGroup}>
                  <button
                    className={styles.btnIncrease}
                    onClick={() => aumentarCantidad(item.id)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                  <button
                    className={styles.btnDecrease}
                    onClick={() => disminuirCantidad(item.id)}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <button
                    className={styles.btnDelete}
                    onClick={() => eliminarProducto(item.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyCart}>No hay productos en el carrito.</p>
      )}

      {productos.length > 0 && (
        <>
          <h4 className={styles.total}>
            Total: S/{" "}
            {productos
              .reduce((acc, item) => acc + item.precio * item.cantidad, 0)
              .toFixed(2)}
          </h4>

          <div className={styles.bottomButtons}>
            <button className={styles.btnYape} onClick={() => setMostrarQR(true)}>
              <FontAwesomeIcon icon={faQrcode} /> Pagar con Yape
            </button>

            <button className={styles.btnVaciar} onClick={vaciarCarrito}>
              <FontAwesomeIcon icon={faShoppingCart} /> Vaciar Carrito
            </button>
          </div>
        </>
      )}

{mostrarQR && !pagoCompletado && (
        <div className={styles.qrModal}>
          <div className={styles.qrContainer}>
            <h3>Escanea el QR con Yape</h3>
            <QRCodeCanvas value="yape://pago-ficticio/123456789" size={200} />
            <p>Esperando confirmación del pago...</p>
          </div>
        </div>
      )}


      {modalAbierto && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wideModal}`}>
            <h3>Pago Completo ✅</h3>
            <h4>Factura</h4>
            <p>
              <strong>Gracias por su compra</strong> {nombreCliente} {apellidoCliente}
            </p>

            <p>
              <strong>Fecha del pedido:</strong> {fechaPedido}
            </p>
            <p>
              <strong>Número de Confirmación:</strong> {numeroConfirmacion}
            </p>

            {/*
              {productos.map((item, index) => (
                <div key={item.id}>
                  <p>
                    <strong>Producto {index + 1}:</strong> {item.nombre}
                  </p>
                  <p>
                    <strong>Cantidad:</strong> {item.cantidad}
                  </p>
                  <p>
                    <strong>Precio Unitario:</strong> S/ {item.precio}
                  </p>
                  <hr />
                </div>
              ))}
            */}


            <p>
              <strong>Total Pagado:</strong> S/{" "}
              {productos
                .reduce((acc, item) => acc + item.precio * item.cantidad, 0)
                .toFixed(2)}
            </p>
            <p>
              <strong>Estado:</strong> Pendiente de recogida
            </p>

            <button className={styles.btnDescargar} onClick={descargarFactura}>
              Descargar Factura PDF
            </button>
            <button
              className={styles.btnAceptar}
              onClick={() => {
                vaciarCarrito();
                eliminarCarritoTrasPago();
              }}
            >
              Aceptar y volver al inicio
            </button>

          </div>
        </div>
      )}
    </div>
  );

};

export default Productocompra; 
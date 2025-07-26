import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./css/productopago.module.css";
import { FaCheckCircle } from "react-icons/fa";
import QRCode from "react-qr-code";
import { getDatabase, ref, set, get, push } from "firebase/database";
import { auth } from "../src/firebase";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";

import 'bootstrap-icons/font/bootstrap-icons.css';

const Productopago = () => {
  const location = useLocation();
  const { producto } = location.state || { producto: null };
  const navigate = useNavigate();

  const [cantidad, setCantidad] = useState(1);
  const [pagoCompleto, setPagoCompleto] = useState(false);
  const [mostrandoQR, setMostrandoQR] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [numeroConfirmacion, setNumeroConfirmacion] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [apellidoCliente, setApellidoCliente] = useState("");

  const subtotal = producto ? producto.precio * cantidad : 0;
  const total = subtotal;

  const [fechaPedido, setFechaPedido] = useState(""); // Definir estado para la fecha



  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `Usuarios/${user.uid}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setNombreCliente(snapshot.val().firstName || "");
          setApellidoCliente(snapshot.val().lastName || "");
        }
      });
    }
  }, []);

  if (!producto) {
    return <p className="text-center">No hay producto seleccionado</p>;
  }

  const generarNumeroConfirmacion = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  

  const handleFinalizarCompra = () => {
    setMostrandoQR(true);
    const numero = generarNumeroConfirmacion();
    setNumeroConfirmacion(numero);

    setTimeout(() => {
      setPagoCompleto(true);
      guardarPedidoEnFirebase(numero);
      setModalAbierto(true);
    }, 5000);
  };

  const guardarPedidoEnFirebase = (numero) => {
    const db = getDatabase();
    const user = auth.currentUser;
    if (!user) return;
  
    // Obtener fecha y hora actual en formato local
    const fechaPedido = new Date().toLocaleString();
    setFechaPedido(fechaPedido); // Guardarlo en el estado para mostrar en la factura
  
    // Referencia a la colección de pedidos
    const pedidosRef = ref(db, "pedidos");
    const nuevoPedidoRef = push(pedidosRef); // Genera un nuevo ID único para el pedido
  
    set(nuevoPedidoRef, {
      userID: user.uid, // Guardar el ID del usuario en un campo separado
      nombrecli: nombreCliente,
      apellidocli: apellidoCliente,
      fechaPedido,
      productos: [
        {
          id: producto.id,
          nombrepro: producto.nombre,
          cantidad: cantidad,
          precio: producto.precio,
        }
      ],
      total: total,
      estado: "pagado",
      recogida: "pendiente",
      numeroConfirmacion: numero,
    });
  
    console.log("Pedido registrado correctamente con ID:", nuevoPedidoRef.key);
  };
  
  
  const descargarFactura = () => {
    const doc = new jsPDF();
    
    // Estilos generales
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
  
    // Título del documento
doc.setFontSize(22);
const pageWidth = doc.internal.pageSize.getWidth(); // Ancho de la página
const titleText = "Factura de Compra R&G MADERERA S.A.C";
const textWidth = doc.getTextWidth(titleText); // Ancho del texto
const x = (pageWidth - textWidth) / 2; // Coordenada X para centrar
doc.text(titleText, x, 20);
  
    // Dibujar una línea separadora
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 30, 190, 30);
  
    // Información del cliente
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(`Cliente: ${nombreCliente} ${apellidoCliente}`, 20, 45);
    doc.text(`Número de Confirmación: ${numeroConfirmacion}`, 20, 55);
    doc.text(`Fecha del Pedido: ${fechaPedido}`, 20, 65);
  
    // Línea separadora
    doc.setDrawColor(180, 180, 180);
    doc.line(20, 75, 190, 75);
  
    // Información del producto
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(`Producto: ${producto.nombre}`, 20, 90);
    doc.text(`Cantidad: ${cantidad}`, 20, 100);
    doc.text(`Precio Unitario: S/ ${producto.precio}`, 20, 110);
  
    // Total pagado con diseño destacado
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Pagado: S/ ${total.toFixed(2)}`, 20, 125);
  
    // Línea separadora
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 135, 190, 135);
  
    // Estado del pedido con estilo de advertencia
    doc.setFontSize(14);
    doc.setTextColor(200, 0, 0);
    doc.text(`Estado: Pendiente de recogida`, 20, 150);
  
    // Guardar el PDF
    doc.save(`Factura_${numeroConfirmacion}.pdf`);
  };
  
  

  

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        
        {/* ✅ Banner Yape centrado arriba de la tarjeta */}
        <div className={styles.bannerYapeFlotante}>
          <p>⚠️ Actualmente solo aceptamos pagos con <strong>Yape</strong>.</p>
        </div>
  
        <h2>Confirmar Compra</h2>
        <img src={producto.imagen} alt={producto.nombre} />
  
        <div className={styles.cardBody}>
          <h5 className={styles.cardTitle}>{producto.nombre}</h5>
          <p><strong>Precio por Unidad:</strong> S/ {producto.precio}</p>
  
          <div className={styles.quantityControl}>
            <button
              className={styles.quantityResta}
              onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
            >
              -
            </button>
            <span className={styles.quantity}>{cantidad}</span>
            <button
              className={styles.quantitySuma}
              onClick={() => setCantidad((prev) => prev + 1)}
            >
              +
            </button>
          </div>
  
          <h5 className={styles.subtotal}>
            <strong>Subtotal:</strong> S/ {subtotal.toFixed(2)}
          </h5>
          <h4 className={styles.total}>
            <strong>Total:</strong> S/ {total.toFixed(2)}
          </h4>
  
          {!mostrandoQR && !pagoCompleto && (
            <button className={styles.button} onClick={handleFinalizarCompra}>
              Pagar con Yape <FaCheckCircle />
            </button>
          )}
  
          {mostrandoQR && !pagoCompleto && (
            <div className={styles.qrContainer}>
              <div className={styles.separator}></div> {/* Línea de separación */}
              <h3>Escanea el QR con Yape</h3>
              <QRCode value="https://yape.com/pago" size={150} />
              <p style={{ marginTop: "20px" }}>
                Esperando confirmación del pago...
              </p>
            </div>
          )}
  
          {modalAbierto && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>Pago Completo  <i className="bi bi-check-circle-fill"></i></h3>
                <p>
                  <strong>Cliente:</strong> {nombreCliente} {apellidoCliente}
                </p>
                <p>
                  <strong>Número de Confirmación:</strong> {numeroConfirmacion}
                </p>
                <p>
                  <strong>Fecha del Pedido:</strong> {fechaPedido}
                </p>
                <p>
                  <strong>Producto:</strong> {producto.nombre}
                </p>
                <p>
                  <strong>Cantidad:</strong> {cantidad}
                </p>
                <p>
                  <strong>Total Pagado:</strong> S/ {total.toFixed(2)}
                </p>
                <p>
                  <strong>Estado:</strong> Pendiente de recogida
                </p>
  
                <button onClick={descargarFactura} className={styles.button}>
                <i className="bi bi-download"></i> Descargar Factura
                </button>
  
                <button
                  onClick={() => navigate("/")}
                  className={styles.closeButton}
                >
                  <i className="bi bi-arrow-left-circle"></i> Cerrar y Volver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default Productopago;
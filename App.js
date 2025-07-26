import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Inicio from './Inicio';
import Login from './login';
import Register from './Register';
import Productocompra from './ProductoCompra';
import Productopago from './productopago';
import Panel from './admin/Panel';
import AgregarProducto from './admin/AgregarProducto';
import VerProductos from './admin/VerProductos';
import EditarProducto from './admin/EditarProductos';
import PrivateRoute from './auth/PrivateRoute';
import MisPedidos from "./MisPedidos";
import ResetPassword from './resetPassword';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 🔐 Rutas protegidas para usuarios autenticados */}
        <Route element={<PrivateRoute />}>
          <Route path="/productocompra" element={<Productocompra />} />
          <Route path="/productopago" element={<Productopago />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
        </Route>

        {/* 🔐 Rutas solo para administradores y empleados */}
        <Route element={<PrivateRoute adminOnly={true} />}>
          <Route path="/panel" element={<Panel />} />
          <Route path="/agregar-producto" element={<AgregarProducto />} />
          <Route path="/productos" element={<VerProductos />} />
          <Route path="/editar-producto/:id" element={<EditarProducto />} />
        </Route>

        {/* Redirección en caso de rutas inválidas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;



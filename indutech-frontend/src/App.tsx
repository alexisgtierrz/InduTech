import { useState, useEffect } from 'react';
import { AbcCalculator } from './components/AbcCalculator';
import { Simulator } from './components/Simulator';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || "${API_URL}";

function App() {
  const [tabActiva, setTabActiva] = useState(() => {
    return localStorage.getItem('pestañaActiva') || 'abc';
  });
  const [inventario, setInventario] = useState<any[]>([]);
  const [nuevoItem, setNuevoItem] = useState({ sku: '', demanda: '', costo: '' });
  const [inventarioABC, setInventarioABC] = useState<any[]>([]);
  const [limiteA, setLimiteA] = useState(80);
  const [limiteB, setLimiteB] = useState(95);

  useEffect(() => {
    localStorage.setItem('pestañaActiva', tabActiva);
  }, [tabActiva]);
  
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/inventory/all`);
        const data = await res.json();
        setInventario(data);
      } catch (e) { console.error("Error al cargar productos", e); }
    };
    cargarProductos();
  }, []);

  useEffect(() => {
    const fetchABC = async () => {
      try {
        const response = await fetch(`${API_URL}/api/inventory/abc?limiteA=${limiteA}&limiteB=${limiteB}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inventario)
        });
        setInventarioABC(await response.json());
      } catch (error) { console.error(error); }
    };
    if (inventario.length > 0) fetchABC();
    else setInventarioABC([]);
    
  }, [inventario, limiteA, limiteB]);

  const agregarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoItem.sku || !nuevoItem.demanda || !nuevoItem.costo) return;
    const productoNuevo = { sku: nuevoItem.sku, demanda: parseFloat(nuevoItem.demanda), costo: parseFloat(nuevoItem.costo) };
    try {
        await fetch(`${API_URL}/api/inventory/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([productoNuevo])
        });
        setInventario([...inventario, productoNuevo]);
        setNuevoItem({ sku: '', demanda: '', costo: '' });
    } catch (e) { console.error("Error al agregar", e); }
  };

  const eliminarProducto = async (skuAEliminar: string) => {
    try {
        await fetch(`${API_URL}/api/inventory/delete/${skuAEliminar}`, {
            method: 'DELETE'
        });
        setInventario(inventario.filter(item => item.sku !== skuAEliminar));
    } catch (e) { console.error("Error al eliminar", e); }
  };

  const editarProducto = async (skuOriginal: string, productoEditado: any) => {
    try {
        await fetch(`${API_URL}/api/inventory/update/${skuOriginal}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoEditado)
        });
        setInventario(inventario.map(item => item.sku === skuOriginal ? productoEditado : item));
    } catch (e) { console.error("Error al editar", e); }
  };

  const [params, setParams] = useState({ demandaAnual: 950, costoPreparacion: 300, tasaProduccion: 2000, costoMantenimiento: 20, diasOperativos: 250, tiempoEntrega: 6, desviacion: 2, nivelServicio: 98, pedidosComparacion: 2, nivelServicioComparacion: 95, tiempoEntregaComparacion: 12 })
  const [resultados, setResultados] = useState({ loteOptimoEPQ: 0, inventarioSeguridad: 0, puntoReorden: 0, inventarioMaximo: 0, tiempoCicloDias: 0, tiempoProduccionDias: 0 });

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/inventory/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        setResultados(await response.json());
      } catch (error) { console.error("Error", error); }
    };
    fetchMetricas();
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>🏭 InduTech S.A. - Control de Inventarios</h1>
      </header>
      <div className="tabs">
        <button className={tabActiva === 'abc' ? 'tab active' : 'tab'} onClick={() => setTabActiva('abc')}>Calculadora Dinámica ABC</button>
        <button className={tabActiva === 'simulador' ? 'tab active' : 'tab'} onClick={() => setTabActiva('simulador')}>Simulador Operativo</button>
      </div>
      <div className="main-content">
        {tabActiva === 'abc' && (
            <AbcCalculator 
                inventario={inventario} 
                inventarioABC={inventarioABC} 
                nuevoItem={nuevoItem} 
                setNuevoItem={setNuevoItem} 
                agregarProducto={agregarProducto} 
                eliminarProducto={eliminarProducto} 
                editarProducto={editarProducto}
                valorTotalInventario={inventarioABC.reduce((acc, item) => acc + item.valorAnual, 0)}
                articuloCritico={inventarioABC.length > 0 ? inventarioABC[0].sku : 'Ninguno'}
                limiteA={limiteA}
                setLimiteA={setLimiteA}
                limiteB={limiteB}
                setLimiteB={setLimiteB}
            />
        )}
        {tabActiva === 'simulador' && (
            <Simulator 
              params={params} 
              setParams={setParams} 
              resultados={resultados} 
              handleChange={handleChange} 
              inventarioABC={inventarioABC} 
            />
        )}
      </div>
    </div>
  );
}
export default App;

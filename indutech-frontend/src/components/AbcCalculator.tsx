import React, { useState } from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';

interface Props {
  inventario: any[];
  inventarioABC: any[];
  nuevoItem: { sku: string; demanda: string; costo: string };
  setNuevoItem: (item: any) => void;
  agregarProducto: (e: React.FormEvent) => void;
  eliminarProducto: (sku: string) => void;
  editarProducto: (skuOriginal: string, productoEditado: any) => void;
  valorTotalInventario: number;
  articuloCritico: string;
  limiteA: number;
  setLimiteA: (val: number) => void;
  limiteB: number;
  setLimiteB: (val: number) => void;
}

export const AbcCalculator = ({ inventarioABC, nuevoItem, setNuevoItem, agregarProducto, eliminarProducto, editarProducto, valorTotalInventario, limiteA,
  setLimiteA,
  limiteB,
  setLimiteB }: Props) => {
  
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ sku: '', demanda: '', costo: '' });

  const iniciarEdicion = (item: any) => {
    setEditingSku(item.sku);
    setEditForm({ sku: item.sku, demanda: item.demanda.toString(), costo: item.costo.toString() });
  };

  const guardarEdicion = (skuOriginal: string) => {
    editarProducto(skuOriginal, {
      sku: editForm.sku,
      demanda: parseFloat(editForm.demanda),
      costo: parseFloat(editForm.costo)
    });
    setEditingSku(null);
  };

  let acumulado = 0;
  const datosProcesados = inventarioABC.map(item => {
    acumulado += item.porcentaje;
    return {
      ...item,
      porcentajeAcumulado: Math.min(Number(acumulado.toFixed(2)), 100)
    };
  });

  return (
    <div className="panel full-width">
      <h2>Gestión de SKUs y Clasificación ABC</h2>
      <div className="inventory-summary">
        <div className="summary-stat">
          <span className="stat-label">Total de Artículos (SKUs)</span>
          <span className="stat-value">{inventarioABC.length}</span>
        </div>
        <div className="summary-stat highlight-stat">
          <span className="stat-label">Valor Anual Total Inmovilizado</span>
          <span className="stat-value">${valorTotalInventario.toLocaleString()}</span>
        </div>
      </div>
      <div className="panel" style={{ marginBottom: '25px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, color: '#334155', fontSize: '1.1em', marginBottom: '15px' }}>
          Configuración de Límites de Clasificación
        </h3>
        
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#16a34a', marginBottom: '8px' }}>
              <span>Límite Clase A</span>
              <span>{limiteA}%</span>
            </label>
            <input 
              type="range" 
              min="10" 
              max="98" 
              value={limiteA} 
              onChange={(e) => {
                const nuevoA = Number(e.target.value);
                setLimiteA(nuevoA);
                if (nuevoA >= limiteB) {
                  setLimiteB(nuevoA + 1);
                }
              }}
              style={{ width: '100%', accentColor: '#16a34a' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#ca8a04', marginBottom: '8px' }}>
              <span>Límite Clase B</span>
              <span>{limiteB}%</span>
            </label>
            <input 
              type="range" 
              min="11" 
              max="99" 
              value={limiteB} 
              onChange={(e) => {
                const nuevoB = Number(e.target.value);
                setLimiteB(nuevoB);
                if (nuevoB <= limiteA) {
                  setLimiteA(nuevoB - 1);
                }
              }}
              style={{ width: '100%', accentColor: '#ca8a04' }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={agregarProducto} className="add-item-form">
        <input type="text" placeholder="Nombre / SKU" value={nuevoItem.sku} onChange={e => setNuevoItem({...nuevoItem, sku: e.target.value})} required />
        <input type="number" placeholder="Demanda Anual" value={nuevoItem.demanda} onChange={e => setNuevoItem({...nuevoItem, demanda: e.target.value})} required />
        <input type="number" step="0.01" placeholder="Costo Unitario ($)" value={nuevoItem.costo} onChange={e => setNuevoItem({...nuevoItem, costo: e.target.value})} required />
        <button type="submit" className="btn-add">+ Agregar Producto</button>
      </form>

      <table className="abc-table">
        <thead>
          <tr>
            <th>SKU</th><th>Demanda Anual</th><th>Costo Unit. ($)</th><th>Valor Anual ($)</th><th>% Acumulado</th><th>Clase</th><th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {datosProcesados.map(item => (
            <tr key={item.sku} className={item.clase === 'A' ? 'row-class-a' : ''}>
              {editingSku === item.sku ? (
                <>
                  <td><input className="edit-input" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})} /></td>
                  <td><input type="number" className="edit-input" value={editForm.demanda} onChange={e => setEditForm({...editForm, demanda: e.target.value})} /></td>
                  <td><input type="number" step="0.01" className="edit-input" value={editForm.costo} onChange={e => setEditForm({...editForm, costo: e.target.value})} /></td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>
                    <button onClick={() => guardarEdicion(item.sku)} className="btn-save" title="Guardar">✔</button>
                    <button onClick={() => setEditingSku(null)} className="btn-delete" title="Cancelar">✖</button>
                  </td>
                </>
              ) : (
                <>
                  <td><strong>{item.sku}</strong></td>
                  <td>{item.demanda}</td>
                  <td>${item.costo}</td>
                  <td>${item.valorAnual.toLocaleString()}</td>
                  <td>{item.porcentajeAcumulado}%</td>
                  <td><span className={`badge class-${item.clase}`}>{item.clase}</span></td>
                  <td>
                    <button onClick={() => iniciarEdicion(item)} className="btn-edit" title="Editar">✎</button>
                    <button onClick={() => eliminarProducto(item.sku)} className="btn-delete" title="Eliminar">✖</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {datosProcesados.length > 0 && (
        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #f1f5f9' }}>
          <h3 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '30px' }}>
            Gráfico de Pareto
          </h3>
          <div style={{ height: '450px', width: '100%', backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px' }}>
            <ResponsiveContainer>
              <ComposedChart data={datosProcesados} margin={{ top: 20, right: 40, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                
                <XAxis 
                  dataKey="sku" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10} 
                />
                
                <YAxis 
                  yAxisId="left" 
                  tickFormatter={(val) => `$${val.toLocaleString()}`} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]} 
                  tickFormatter={(val) => `${val}%`} 
                  tick={{ fill: '#0f172a', fontWeight: 'bold', fontSize: 12 }} 
                />
                
                <Tooltip 
                  formatter={(value: any, name: any) => 
                    name === '% Acumulado' 
                      ? [`${value}%`, name] 
                      : [`$${Number(value).toLocaleString()}`, name]
                  }
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />

                <Bar yAxisId="left" dataKey="valorAnual" name="Valor Anual ($)" radius={[4, 4, 0, 0]}>
                  {datosProcesados.map((entry, index) => {
                    const colores = { A: '#86efac', B: '#fef08a', C: '#fca5a5' };
                    return <Cell key={`cell-${index}`} fill={colores[entry.clase as keyof typeof colores]} />;
                  })}
                </Bar>

                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="porcentajeAcumulado" 
                  name="% Acumulado" 
                  stroke="#0f172a" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#0f172a', stroke: '#ffffff', strokeWidth: 2 }} 
                  activeDot={{ r: 8 }} 
                />

                <ReferenceLine y={limiteA} stroke="#16a34a" strokeDasharray="5 5" label={{ position: 'top', value: `Límite Clase A (${limiteA}%)`, fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                <ReferenceLine y={limiteB} stroke="#ca8a04" strokeDasharray="5 5" label={{ position: 'insideTop', value: `Límite Clase B (${limiteB}%)`, fill: '#ca8a04', fontSize: 12, fontWeight: 'bold' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
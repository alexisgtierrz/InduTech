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
}

export const AbcCalculator = ({ inventario, inventarioABC, nuevoItem, setNuevoItem, agregarProducto, eliminarProducto, editarProducto, valorTotalInventario, articuloCritico }: Props) => {
  
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
      
      <form onSubmit={agregarProducto} className="add-item-form">
        <input type="text" placeholder="Nombre / SKU" value={nuevoItem.sku} onChange={e => setNuevoItem({...nuevoItem, sku: e.target.value})} required />
        <input type="number" placeholder="Demanda Anual" value={nuevoItem.demanda} onChange={e => setNuevoItem({...nuevoItem, demanda: e.target.value})} required />
        <input type="number" step="0.01" placeholder="Costo Unitario ($)" value={nuevoItem.costo} onChange={e => setNuevoItem({...nuevoItem, costo: e.target.value})} required />
        <button type="submit" className="btn-add">+ Agregar Producto</button>
      </form>

      <table className="abc-table">
        <thead>
          <tr>
            <th>SKU</th><th>Demanda Anual</th><th>Costo Unit.</th><th>Valor Anual ($)</th><th>% Acumulado</th><th>Clase</th><th>Acción</th>
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

                <ReferenceLine yAxisId="right" y={80} stroke="#16a34a" strokeDasharray="5 5" label={{ position: 'top', value: 'Límite Clase A (80%)', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }} />
                <ReferenceLine yAxisId="right" y={96} stroke="#ca8a04" strokeDasharray="5 5" label={{ position: 'insideTop', value: 'Límite Clase B (96%)', fill: '#ca8a04', fontSize: 12, fontWeight: 'bold' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
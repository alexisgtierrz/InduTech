import React, { useState } from 'react';

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

  return (
    <div className="panel full-width">
      <h2>Gestión de SKUs y Clasificación de Pareto</h2>
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
          {inventarioABC.map(item => (
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
                  <td>{item.porcentaje}%</td>
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
      
      <div className="abc-conclusion">
        <p><strong>Diagnóstico en vivo:</strong> El artículo de mayor impacto es <strong>{articuloCritico}</strong>.</p>
      </div>
    </div>
  );
};
import React from 'react';

interface Props {
  inventario: any[];
  inventarioABC: any[];
  nuevoItem: { sku: string; demanda: string; costo: string };
  setNuevoItem: (item: any) => void;
  agregarProducto: (e: React.FormEvent) => void;
  eliminarProducto: (sku: string) => void;
  valorTotalInventario: number;
  articuloCritico: string;
}

export const AbcCalculator = ({ inventario, inventarioABC, nuevoItem, setNuevoItem, agregarProducto, eliminarProducto, valorTotalInventario, articuloCritico }: Props) => {
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
        <input type="number" placeholder="Costo Unitario ($)" value={nuevoItem.costo} onChange={e => setNuevoItem({...nuevoItem, costo: e.target.value})} required />
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
              <td><strong>{item.sku}</strong></td><td>{item.demanda}</td><td>${item.costo}</td><td>${item.valorAnual.toLocaleString()}</td><td>{item.porcentaje}%</td>
              <td><span className={`badge class-${item.clase}`}>{item.clase}</span></td>
              <td><button onClick={() => eliminarProducto(item.sku)} className="btn-delete">✖</button></td>
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
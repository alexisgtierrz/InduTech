import React from 'react';

interface Props {
  params: any;
  resultados: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const Simulator = ({ params, resultados, handleChange }: Props) => {
  return (
    <div className="simulador-container full-width">
      <div className="panel global-params">
        <h2>Parámetros Globales (Afectan a todo el modelo)</h2>
        <div className="inputs-row">
          <div className="input-group">
            <label>Demanda Anual (D):</label>
            <input type="number" name="demandaAnual" value={params.demandaAnual} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Días Operativos:</label>
            <input type="number" name="diasOperativos" value={params.diasOperativos} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="simulador-grid">
        <div className="panel sim-module module-epq">
          <h3 className="module-title">1. Modelo de Producción (EPQ)</h3>
          <div className="module-inputs">
            <div className="input-group">
              <label>Tasa de Producción Anual (p):</label>
              <input type="number" name="tasaProduccion" value={params.tasaProduccion} onChange={handleChange} />
            </div>
            <div className="input-row-half">
              <div className="input-group">
                <label>Costo Prep. (Co):</label>
                <input type="number" name="costoPreparacion" value={params.costoPreparacion} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Costo Mant. (Ch):</label>
                <input type="number" name="costoMantenimiento" value={params.costoMantenimiento} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="mini-cards-grid">
            <div className="mini-card card-blue"><h4>{resultados.loteOptimoEPQ}</h4><p>Lote Óptimo (Q*)</p></div>
            <div className="mini-card card-lightblue"><h4>{resultados.inventarioMaximo}</h4><p>Inventario Máximo (Imax)</p></div>
            <div className="mini-card card-gray"><h4>{resultados.tiempoCicloDias} días</h4><p>T (días)</p></div>
            <div className="mini-card card-gray"><h4>{resultados.tiempoProduccionDias} días</h4><p>Tiempo de Prod. (t1)</p></div>
          </div>
        </div>

        <div className="panel sim-module module-rop">
          <h3 className="module-title">2. Gestión de Riesgos (ROP)</h3>
          <div className="module-inputs">
            <div className="input-group">
              <label>Nivel de Servicio (Z):</label>
              <select name="z" value={params.z} onChange={handleChange}>
                <option value={1.65}>95%</option>
                <option value={2.05}>98%</option>
                <option value={2.33}>99%</option>
              </select>
            </div>
            <div className="input-row-half">
              <div className="input-group">
                <label>Tiempo Entrega (L):</label>
                <input type="number" name="tiempoEntrega" value={params.tiempoEntrega} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Desviación (σL):</label>
                <input type="number" name="desviacion" value={params.desviacion} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="mini-cards-grid grid-2-cols">
            <div className="mini-card card-red"><h4>{resultados.puntoReorden}</h4><p>ROP</p></div>
            <div className="mini-card card-green"><h4>{resultados.inventarioSeguridad}</h4><p>Inventario Seguridad (SS)</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};
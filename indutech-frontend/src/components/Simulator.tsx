import React, { useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface Props {
  params: any;
  setParams: any;
  resultados: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  inventarioABC: any[];
}

export const Simulator = ({ params, setParams, resultados, handleChange, inventarioABC }: Props) => {

  // --- Datos para el gráfico EPQ (curva de inventario tipo "trapecio" en 2 ciclos) ---
  const datosEPQ = useMemo(() => {
    const t1 = resultados.tiempoProduccionDias;
    const T = resultados.tiempoCicloDias;
    const imax = resultados.inventarioMaximo;

    if (!T || T <= 0) return [];

    const ciclos = 2;
    const data: { dia: number; nivel: number; fase: string }[] = [];

    for (let c = 0; c < ciclos; c++) {
      const base = c * T;
      data.push({ dia: base, nivel: 0, fase: 'Inicio de producción' });
      data.push({ dia: base + t1, nivel: imax, fase: 'Fin de producción / Inicio de consumo' });
      data.push({ dia: base + T, nivel: 0, fase: 'Stock agotado' });
    }
    return data;
  }, [resultados.tiempoProduccionDias, resultados.tiempoCicloDias, resultados.inventarioMaximo]);

  // --- Datos para el gráfico de Punto de Reorden (agotamiento lineal de inventario) ---
  const { datosROP, diaPedido } = useMemo(() => {
    const T = resultados.tiempoCicloDias;
    const imax = resultados.inventarioMaximo;
    const rop = resultados.puntoReorden;
    const demandaDiaria = params.diasOperativos > 0 ? params.demandaAnual / params.diasOperativos : 0;

    if (!T || T <= 0 || demandaDiaria <= 0) return { datosROP: [], diaPedido: 0 };

    const puntos = 30;
    const data: { dia: number; nivel: number }[] = [];
    for (let i = 0; i <= puntos; i++) {
      const dia = (T * i) / puntos;
      const nivel = Math.max(imax - demandaDiaria * dia, 0);
      data.push({ dia: Number(dia.toFixed(2)), nivel: Number(nivel.toFixed(2)) });
    }

    const diaParaPedir = demandaDiaria > 0 ? (imax - rop) / demandaDiaria : 0;

    return { datosROP: data, diaPedido: Number(diaParaPedir.toFixed(2)) };
  }, [resultados, params.demandaAnual, params.diasOperativos]);

  const handleSelectSKU = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skuSeleccionado = e.target.value;
    const producto = inventarioABC.find(item => item.sku === skuSeleccionado);
    
    if (producto) {
      setParams((prev: any) => ({
        ...prev,
        demandaAnual: producto.demanda
      }));
    }
  };

  return (
    <div className="simulador-container full-width">
      
      <div className="panel" style={{ marginBottom: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1em' }}>Seleccionar Producto a Analizar:</label>
          <select 
            onChange={handleSelectSKU} 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #94a3b8', fontSize: '1em', minWidth: '300px' }}
          >
            {inventarioABC.map(item => (
              <option key={item.sku} value={item.sku}>
                {item.sku} - Clase {item.clase} (Demanda: {item.demanda})
              </option>
            ))}
          </select>
        </div>
      </div>

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
          <h3 className="module-title">Modelo de Producción (EPQ)</h3>
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
          <h3 className="module-title">Gestión de Riesgos (ROP)</h3>
          <div className="module-inputs">
            <div className="input-group">
              <label>Nivel de Servicio (%):</label>
              <input 
                type="number" 
                name="nivelServicio" 
                min="50" 
                max="99.9" 
                step="0.1" 
                value={params.nivelServicio} 
                onChange={handleChange} 
              />
            </div>
            <div className="input-row-half">
              <div className="input-group">
                <label>Tiempo Entrega (L):</label>
                <input type="number" name="tiempoEntrega" value={params.tiempoEntrega} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Desviación Demanda (σd):</label>
                <input type="number" name="desviacion" value={params.desviacion} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="mini-cards-grid grid-2-cols">
            <div className="mini-card card-red"><h4>{resultados.puntoReorden}</h4><p>Punto de Reorden (ROP)</p></div>
            <div className="mini-card card-green"><h4>{resultados.inventarioSeguridad}</h4><p>Inventario Seguridad (SS)</p></div>
          </div>
        </div>
      </div>

      <div className="panel full-width chart-panel">
        <h3 className="module-title">Evolución del Inventario — Modelo EPQ</h3>
        <p className="chart-subtitle">
          Durante <strong>{resultados.tiempoProduccionDias} días</strong> se produce y consume a la vez (el inventario sube),
          luego durante <strong>{resultados.tiempoCicloDias - resultados.tiempoProduccionDias} días</strong> solo se consume
          (el inventario baja) hasta agotarse, reiniciando el ciclo.
        </p>
        <div style={{ height: '380px', width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart data={datosEPQ} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Días', position: 'insideBottom', offset: -10, fill: '#64748b' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Unidades en inventario', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                formatter={(value: any) => [`${value} u.`, 'Inventario']}
                labelFormatter={(label) => `Día ${label}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <ReferenceLine
                y={resultados.inventarioMaximo}
                stroke="#2563eb"
                strokeDasharray="5 5"
                label={{ position: 'insideTopLeft', value: `Imax = ${resultados.inventarioMaximo}`, fill: '#2563eb', fontSize: 12, fontWeight: 'bold' }}
              />
              <Area
                type="linear"
                dataKey="nivel"
                name="Inventario"
                stroke="#2563eb"
                fill="#bfdbfe"
                fillOpacity={0.5}
                strokeWidth={3}
                dot={{ r: 3, fill: '#2563eb' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel full-width chart-panel">
        <h3 className="module-title">Evolución del Inventario — Punto de Reorden (ROP)</h3>
        <p className="chart-subtitle">
          El inventario se agota a un ritmo constante. Al llegar al día <strong>{diaPedido}</strong> se alcanza el{' '}
          <strong>Punto de Reorden ({resultados.puntoReorden} u.)</strong> y debe lanzarse el pedido; durante el tiempo de
          entrega ({params.tiempoEntrega} días) el inventario sigue bajando hasta el{' '}
          <strong>Stock de Seguridad ({resultados.inventarioSeguridad} u.)</strong>, que actúa como colchón ante variaciones de demanda.
        </p>
        <div style={{ height: '380px', width: '100%' }}>
          <ResponsiveContainer>
            <LineChart data={datosROP} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Días', position: 'insideBottom', offset: -10, fill: '#64748b' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Unidades en inventario', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip
                formatter={(value: any) => [`${value} u.`, 'Inventario']}
                labelFormatter={(label) => `Día ${label}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <ReferenceLine
                y={resultados.puntoReorden}
                stroke="#dc2626"
                strokeDasharray="5 5"
                label={{ position: 'insideTopLeft', value: `ROP = ${resultados.puntoReorden}`, fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }}
              />
              <ReferenceLine
                y={resultados.inventarioSeguridad}
                stroke="#16a34a"
                strokeDasharray="5 5"
                label={{ position: 'insideBottomLeft', value: `SS = ${resultados.inventarioSeguridad}`, fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }}
              />
              <ReferenceLine
                x={diaPedido}
                stroke="#9333ea"
                strokeDasharray="3 3"
                label={{ position: 'top', value: 'Se lanza el pedido', fill: '#9333ea', fontSize: 12, fontWeight: 'bold' }}
              />
              <Line
                type="linear"
                dataKey="nivel"
                name="Inventario"
                stroke="#0f172a"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel full-width chart-panel">
        <h3 className="module-title">Riesgo de Faltantes y Tasa de Servicio</h3>
        <p className="chart-subtitle">
          Con un nivel de servicio configurado de <strong>{params.nivelServicio}%</strong>, cada ciclo de pedido tiene una
          probabilidad de <strong>{(resultados.escenarioActual?.probabilidadFaltantePorCiclo * 100).toFixed(2)}%</strong> de
          quedarse sin stock antes de que llegue el siguiente pedido, con un faltante esperado de{' '}
          <strong>{resultados.escenarioActual?.faltanteEsperadoPorCiclo.toFixed(2)} unidades</strong> por ciclo en ese caso.
        </p>

        <div className="comparativa-grid">
          <div className="comparativa-col">
            <h4 className="comparativa-titulo">Escenario Actual (EPQ óptimo)</h4>
            <div className="mini-cards-grid grid-2-cols">
              <div className="mini-card card-gray">
                <h4>{resultados.escenarioActual?.numeroPedidosAnual.toFixed(1)}</h4>
                <p>Pedidos al año</p>
              </div>
              <div className="mini-card card-gray">
                <h4>{resultados.escenarioActual?.loteOptimoPorPedido.toFixed(0)}</h4>
                <p>Unidades por pedido</p>
              </div>
              <div className="mini-card card-amber">
                <h4>{resultados.escenarioActual?.faltanteEsperadoAnual.toFixed(1)}</h4>
                <p>Unidades en faltante esperadas / año</p>
              </div>
              <div className="mini-card card-red">
                <h4>{resultados.escenarioActual?.vecesSinStockEsperadasAnio.toFixed(2)}</h4>
                <p>Veces sin stock esperadas / año</p>
              </div>
            </div>
          </div>

          <div className="comparativa-col">
            <div className="comparativa-header">
              <h4 className="comparativa-titulo">Escenario de Comparación</h4>
              <div className="input-pedidos-comparacion">
                <label>N° de pedidos al año:</label>
                <input
                  type="number"
                  name="pedidosComparacion"
                  min="1"
                  step="1"
                  value={params.pedidosComparacion}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mini-cards-grid grid-2-cols">
              <div className="mini-card card-gray">
                <h4>{resultados.escenarioComparacion?.numeroPedidosAnual.toFixed(1)}</h4>
                <p>Pedidos al año</p>
              </div>
              <div className="mini-card card-gray">
                <h4>{resultados.escenarioComparacion?.loteOptimoPorPedido.toFixed(0)}</h4>
                <p>Unidades por pedido</p>
              </div>
              <div className="mini-card card-amber">
                <h4>{resultados.escenarioComparacion?.faltanteEsperadoAnual.toFixed(1)}</h4>
                <p>Unidades en faltante esperadas / año</p>
              </div>
              <div className="mini-card card-red">
                <h4>{resultados.escenarioComparacion?.vecesSinStockEsperadasAnio.toFixed(2)}</h4>
                <p>Veces sin stock esperadas / año</p>
              </div>
            </div>
          </div>
        </div>

        <p className="chart-subtitle" style={{ marginTop: '20px' }}>
          {resultados.escenarioComparacion?.vecesSinStockEsperadasAnio < resultados.escenarioActual?.vecesSinStockEsperadasAnio
            ? `Pasar a ${params.pedidosComparacion} pedido(s) al año reduciría el riesgo esperado de quedarse sin stock, ya que hay menos ciclos de pedido en el año (menos oportunidades de fallar), aunque cada pedido sería de un lote mayor y elevaría el costo de mantenimiento.`
            : `Pasar a ${params.pedidosComparacion} pedido(s) al año aumentaría el riesgo esperado de quedarse sin stock, ya que la probabilidad de faltante por ciclo no cambia y se está comparando contra un número similar o mayor de ciclos riesgosos al año.`}
        </p>
      </div>
    </div>
  );
};